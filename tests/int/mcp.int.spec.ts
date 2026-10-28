import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * The MCP endpoint as Claude reaches it: JSON-RPC over the streamable HTTP
 * transport, authenticated by an API key from `payload-mcp-api-keys`. What a
 * client may do is what the plugin exposes (no delete, no messages), and
 * whatever it writes in a collection with drafts or a global stays a draft
 * (hooks/mcpWritesAreDrafts.ts).
 */

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const config = await configPromise

const API_KEY = 'mcp-int-test-key-0123456789abcdef'
const EDITOR = { email: 'mcp-editor@test.local', password: 'mcp-editor' }

let payload: Payload
let editorId: number
let keyId: number
const projectIds: number[] = []
let heroTitle: unknown

let nextId = 1

/** One JSON-RPC call; the transport may answer as JSON or as an SSE stream. */
const mcp = async (method: string, params: Record<string, unknown> = {}, apiKey = API_KEY) => {
  const response = await handleEndpoints({
    config,
    request: new Request('http://localhost:3000/api/mcp', {
      body: JSON.stringify({ id: nextId++, jsonrpc: '2.0', method, params }),
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }),
  })
  const text = await response.text()
  const json = text.trimStart().startsWith('{')
    ? text
    : text
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .pop()

  return {
    body: json ? (JSON.parse(json) as { error?: unknown; result?: Record<string, unknown> }) : {},
    status: response.status,
  }
}

const callTool = async (name: string, args: Record<string, unknown>) => {
  const { body } = await mcp('tools/call', { arguments: args, name })
  const result = body.result as { content?: { text: string }[]; isError?: boolean } | undefined
  expect(result?.isError, JSON.stringify(body)).not.toBe(true)
  return result
}

beforeAll(async () => {
  payload = await getPayload({ config })

  editorId = (await payload.create({ collection: 'users', data: EDITOR })).id

  const key = await payload.create({
    collection: 'payload-mcp-api-keys',
    data: {
      apiKey: API_KEY,
      enableAPIKey: true,
      hero: { find: true, update: true },
      label: 'MCP int test',
      projects: { create: true, find: true, update: true },
      companies: { find: true, update: true },
      user: editorId,
    } as never,
  })
  keyId = key.id

  heroTitle = (await payload.findGlobal({ slug: 'hero' })).title
})

afterAll(async () => {
  await payload
    .updateGlobal({ slug: 'hero', data: { title: heroTitle, _status: 'published' } as never })
    .catch((error: unknown) => {
      // A never-saved hero reads as defaults that break their own maxLength.
      if ((error as Error).name !== 'ValidationError') throw error
    })
  for (const id of projectIds) {
    await payload.delete({ collection: 'projects', id, trash: true })
  }
  await payload.delete({ collection: 'payload-mcp-api-keys', id: keyId })
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

describe('the MCP endpoint', () => {
  it('refuses a caller without a valid key', async () => {
    const { body, status } = await mcp('tools/list', {}, 'not-a-key')

    expect(status === 401 || status === 403 || Boolean(body.error)).toBe(true)
  })

  it('offers no delete tool and nothing on messages', async () => {
    const { body } = await mcp('tools/list')
    const names = ((body.result?.tools ?? []) as { name: string }[]).map((tool) => tool.name)

    expect(names).toEqual(
      expect.arrayContaining(['createProjects', 'updateProjects', 'updateHero']),
    )
    expect(names.filter((name) => /^delete/i.test(name))).toEqual([])
    expect(names.filter((name) => /messages/i.test(name))).toEqual([])
  })
})

describe('what Claude writes through MCP', () => {
  it('creates a project as a draft, invisible to visitors', async () => {
    await callTool('createProjects', {
      _status: 'published',
      description: textToLexicalParagraphs('Written by Claude.'),
      shortDescription: 'Written by Claude.',
      slug: 'mcp-created',
      title: 'Created through MCP',
    })

    const { docs } = await payload.find({
      collection: 'projects',
      draft: true,
      where: { slug: { equals: 'mcp-created' } },
    })
    expect(docs).toHaveLength(1)
    projectIds.push(docs[0]!.id)
    expect(docs[0]!._status).toBe('draft')

    const visitor = await payload.find({
      collection: 'projects',
      overrideAccess: false,
      where: { slug: { equals: 'mcp-created' } },
    })
    expect(visitor.docs).toHaveLength(0)
  })

  it('saves an edit to a published project as a draft, leaving the live version', async () => {
    const project = await payload.create({
      collection: 'projects',
      data: {
        _status: 'published',
        description: textToLexicalParagraphs('Live.'),
        shortDescription: 'Live.',
        slug: 'mcp-published',
        title: 'Live title',
      },
    })
    projectIds.push(project.id)

    // Even when asked to publish.
    await callTool('updateProjects', {
      _status: 'published',
      id: project.id,
      title: 'Claude title',
    })

    const live = await payload.findByID({ collection: 'projects', id: project.id })
    expect(live.title).toBe('Live title')
    expect(live._status).toBe('published')

    const latest = await payload.findByID({ collection: 'projects', draft: true, id: project.id })
    expect(latest.title).toBe('Claude title')
    expect(latest._status).toBe('draft')
  })

  it('saves an edit to a global as a draft, leaving the live version', async () => {
    await payload.updateGlobal({
      slug: 'hero',
      data: { title: 'Live hero', _status: 'published' } as never,
    })

    await callTool('updateHero', { _status: 'published', title: 'Claude hero' })

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Live hero')
    expect((await payload.findGlobal({ draft: true, slug: 'hero' })).title).toBe('Claude hero')
  })
})

describe('trashing through MCP', () => {
  it('cannot put a document in the trash by setting deletedAt', async () => {
    const company = await payload.create({ collection: 'companies', data: { name: 'MCP company' } })

    try {
      await callTool('updateCompanies', { deletedAt: new Date().toISOString(), id: company.id })

      const after = await payload.findByID({ collection: 'companies', id: company.id, trash: true })
      expect(after.deletedAt ?? null).toBeNull()
    } finally {
      await payload.delete({ collection: 'companies', id: company.id, trash: true })
    }
  })
})

describe('a user who owns an MCP key', () => {
  it('can be deleted, and their keys go with them', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'mcp-leaving@test.local', password: 'mcp-leaving' },
    })
    const key = await payload.create({
      collection: 'payload-mcp-api-keys',
      data: { label: 'Leaving', user: user.id } as never,
    })

    await payload.delete({ collection: 'users', id: user.id })

    const { totalDocs } = await payload.count({
      collection: 'payload-mcp-api-keys',
      where: { id: { equals: key.id } },
    })
    expect(totalDocs).toBe(0)
  })
})

describe('an MCP key outside the MCP endpoint', () => {
  // Payload leaves `payload-mcp-api-keys` out of its API-key strategy, so a key
  // can't stand in for a logged-in editor on REST — where "logged in" means
  // every right, past the key's ticked capabilities and the drafts rule.
  // Pinned here in case that ever changes.
  it.each(['/messages', '/users', '/projects?draft=true&trash=true'])(
    'does not authenticate a REST read of %s',
    async (path) => {
      const response = await handleEndpoints({
        config,
        request: new Request(`http://localhost:3000/api${path}`, {
          headers: { Authorization: `payload-mcp-api-keys API-Key ${API_KEY}` },
        }),
      })

      if (response.status === 200) {
        const body = (await response.json()) as { docs: { _status?: string; deletedAt?: string }[] }
        // An open collection still answers, but only with what a visitor sees.
        expect(path).toMatch(/^\/projects/)
        expect(body.docs.every((doc) => doc._status === 'published' && !doc.deletedAt)).toBe(true)
      } else {
        expect([401, 403]).toContain(response.status)
      }
    },
  )
})

describe('reordering through MCP', () => {
  it('cannot move a published project on the site', async () => {
    const project = await payload.create({
      collection: 'projects',
      data: {
        _status: 'published',
        description: textToLexicalParagraphs('Ordered.'),
        shortDescription: 'Ordered.',
        slug: 'mcp-ordered',
        title: 'Ordered',
      },
    })
    projectIds.push(project.id)
    const before = (await payload.findByID({ collection: 'projects', id: project.id }))._order

    await callTool('updateProjects', { _order: '0000', id: project.id, title: 'Reordered?' })

    expect((await payload.findByID({ collection: 'projects', id: project.id }))._order).toBe(before)
  })
})
