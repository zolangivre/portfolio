import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * "Exporter" in the admin lists: a CSV or JSON download built within the
 * request (POST /api/exports/download), for editors only. No file is stored
 * and nothing can be imported back. A CSV of the messages holds what visitors
 * typed, so it reaches a spreadsheet with its formulas neutralized.
 */

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const config = await configPromise

const EDITOR = { email: 'export-editor@test.local', password: 'export-editor' }

let payload: Payload
let editorId: number
let token: string
const projectIds: number[] = []
let messageId: number

const FORMULA = '=HYPERLINK("http://evil.test","clic")'

const download = (data: Record<string, unknown>, auth = true) =>
  handleEndpoints({
    config,
    request: new Request('http://localhost:3000/api/exports/download', {
      body: JSON.stringify({ data }),
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `JWT ${token}` } : {}),
      },
      method: 'POST',
    }),
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  editorId = (await payload.create({ collection: 'users', data: EDITOR })).id
  token = (await payload.login({ collection: 'users', data: EDITOR })).token!

  for (const [slug, status] of [
    ['export-live', 'published'],
    ['export-draft', 'draft'],
  ] as const) {
    const project = await payload.create({
      collection: 'projects',
      data: {
        _status: status,
        description: textToLexicalParagraphs('Export test.'),
        shortDescription: 'Export test.',
        slug,
        title: `Projet ${slug}`,
      },
    })
    projectIds.push(project.id)
  }

  messageId = (
    await payload.create({
      collection: 'messages',
      data: { email: 'visitor@test.local', message: '@SUM(1+1)', name: FORMULA },
    })
  ).id
})

afterAll(async () => {
  for (const id of projectIds) {
    await payload.delete({ collection: 'projects', id, trash: true })
  }
  await payload.delete({ collection: 'messages', id: messageId, trash: true })
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

describe('exporting a collection', () => {
  it('downloads a CSV of the projects for an editor', async () => {
    const response = await download({
      collectionSlug: 'projects',
      drafts: 'yes',
      format: 'csv',
      locale: 'fr',
    })

    expect(response.status).toBe(200)
    const csv = await response.text()
    expect(csv.split('\n')[0]).toMatch(/\bslug\b/)
    expect(csv).toContain('export-live')
    expect(csv).toContain('export-draft')
  })

  it('leaves drafts out when asked to', async () => {
    const response = await download({
      collectionSlug: 'projects',
      drafts: 'no',
      format: 'json',
      locale: 'fr',
    })

    const docs = (await response.json()) as { slug: string }[]
    const slugs = docs.map((doc) => doc.slug)
    expect(slugs).toContain('export-live')
    expect(slugs).not.toContain('export-draft')
  })

  it('stores nothing', async () => {
    expect((await payload.count({ collection: 'exports' })).totalDocs).toBe(0)
  })

  it('refuses a visitor, even on a collection anyone can read', async () => {
    for (const collectionSlug of ['projects', 'messages']) {
      const response = await download({ collectionSlug, format: 'csv' }, false)

      expect(response.status).not.toBe(200)
      expect(await response.text()).not.toContain('export-live')
    }
  })
})

describe("a visitor's message in an export", () => {
  it('neutralizes formulas in a CSV', async () => {
    const response = await download({ collectionSlug: 'messages', format: 'csv' })

    expect(response.status).toBe(200)
    const csv = await response.text()
    expect(csv).toContain(`"'=HYPERLINK(""http://evil.test"",""clic"")"`)
    expect(csv).toContain(`'@SUM(1+1)`)
    expect(csv).toContain('visitor@test.local')
  })

  it('keeps the exact text in JSON, which no spreadsheet evaluates', async () => {
    const response = await download({ collectionSlug: 'messages', format: 'json' })

    const docs = (await response.json()) as { message: string; name: string }[]
    expect(docs.find((doc) => doc.name === FORMULA)?.message).toBe('@SUM(1+1)')
  })
})

describe('importing', () => {
  it('refuses an editor on the API, not only in the menu', async () => {
    const response = await handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/imports', {
        body: JSON.stringify({ collectionSlug: 'projects', importMode: 'create' }),
        headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    })

    expect(response.status).toBe(403)
    expect((await payload.count({ collection: 'imports' })).totalDocs).toBe(0)
  })
})
