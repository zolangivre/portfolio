import {
  Forbidden,
  getPayload,
  handleEndpoints,
  NotFound,
  ValidationError,
  type CollectionSlug,
  type GlobalSlug,
  type Payload,
  type TypedUser,
} from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * Access rules, exercised through the Local API with `overrideAccess: false`.
 * That runs the same access functions as the REST and GraphQL endpoints —
 * the ones a visitor can actually reach — without an HTTP server.
 *
 * The site's own pages read with access overridden, so none of this shows in
 * the UI: a rule that silently opens up would only ever be noticed by whoever
 * went looking at /api/<collection>.
 */

const config = await configPromise

type ReadPolicy =
  | 'anyone' // open to visitors
  | 'published-only' // visitors see `_status: 'published'` documents only
  | 'editors' // closed to visitors

/**
 * What an anonymous visitor may do, per collection. Update and delete are
 * editor-only everywhere, so they aren't listed. Adding a collection without
 * an entry here fails the suite — the point is to decide, not to inherit.
 */
const collectionPolicy: Record<CollectionSlug, { read: ReadPolicy; create: 'anyone' | 'editors' }> =
  {
    categories: { read: 'anyone', create: 'editors' },
    companies: { read: 'anyone', create: 'editors' },
    education: { read: 'published-only', create: 'editors' },
    experiences: { read: 'published-only', create: 'editors' },
    exports: { read: 'editors', create: 'editors' },
    imports: { read: 'editors', create: 'editors' },
    journal: { read: 'published-only', create: 'editors' },
    media: { read: 'editors', create: 'editors' },
    messages: { read: 'editors', create: 'anyone' },
    'payload-folders': { read: 'editors', create: 'editors' },
    'payload-jobs': { read: 'editors', create: 'editors' },
    'payload-kv': { read: 'editors', create: 'editors' },
    'payload-locked-documents': { read: 'editors', create: 'editors' },
    // MCP API keys: each editor sees and manages their own keys only.
    'payload-mcp-api-keys': { read: 'editors', create: 'editors' },
    'payload-migrations': { read: 'editors', create: 'editors' },
    'payload-preferences': { read: 'editors', create: 'editors' },
    projects: { read: 'published-only', create: 'editors' },
    redirects: { read: 'editors', create: 'editors' },
    schools: { read: 'anyone', create: 'editors' },
    skills: { read: 'anyone', create: 'editors' },
    technologies: { read: 'anyone', create: 'editors' },
    testimonials: { read: 'anyone', create: 'editors' },
    users: { read: 'editors', create: 'editors' },
    videos: { read: 'editors', create: 'editors' },
  }

const collections = config.collections.map((collection) => collection.slug as CollectionSlug)
const globals = config.globals.map((global) => global.slug as GlobalSlug)

// A `where` that matches every document, for the bulk update/delete calls.
const everyDocument = { id: { exists: true } }

let payload: Payload
let editor: TypedUser

const created: { collection: CollectionSlug; id: number }[] = []

const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
  created.push({ collection, id: doc.id })
  return doc
}

beforeAll(async () => {
  payload = await getPayload({ config })

  const user = await payload.create({
    collection: 'users',
    data: { email: 'access-editor@test.local', password: 'access-editor' },
  })
  editor = { ...track('users', user), collection: 'users' } as TypedUser

  const category = track(
    'categories',
    await payload.create({
      collection: 'categories',
      data: { group: 'journal', name: 'Access', slug: 'access-journal' },
    }),
  )

  const company = track(
    'companies',
    await payload.create({ collection: 'companies', data: { name: 'Access company' } }),
  )
  const school = track(
    'schools',
    await payload.create({ collection: 'schools', data: { name: 'Access school' } }),
  )

  for (const status of ['published', 'draft'] as const) {
    track(
      'projects',
      await payload.create({
        collection: 'projects',
        data: {
          _status: status,
          description: textToLexicalParagraphs('Description.'),
          shortDescription: 'Short description.',
          slug: `access-${status}-project`,
          title: `Access ${status} project`,
        },
      }),
    )

    track(
      'journal',
      await payload.create({
        collection: 'journal',
        data: {
          _status: status,
          category: category.id,
          content: textToLexicalParagraphs('Content.'),
          date: '2026-01-01T00:00:00.000Z',
          shortDescription: 'Short description.',
          slug: `access-${status}-entry`,
          title: `Access ${status} entry`,
        },
      }),
    )

    track(
      'experiences',
      await payload.create({
        collection: 'experiences',
        data: {
          _status: status,
          company: company.id,
          description: textToLexicalParagraphs('Description.'),
          position: `access-${status}-experience`,
          startDate: '2025-01-01T00:00:00.000Z',
        },
      }),
    )

    track(
      'education',
      await payload.create({
        collection: 'education',
        data: {
          _status: status,
          degree: `access-${status}-education`,
          description: textToLexicalParagraphs('Description.'),
          school: school.id,
          startDate: '2025-01-01T00:00:00.000Z',
        },
      }),
    )
  }
})

afterAll(async () => {
  // Reverse order: documents before the category and user they point at.
  for (const { collection, id } of created.reverse()) {
    await payload.delete({ collection, id })
  }

  await payload?.destroy()
})

describe('access policy table', () => {
  it('covers every collection in the config', () => {
    expect(Object.keys(collectionPolicy).sort()).toEqual([...collections].sort())
  })
})

describe.each(collections)('anonymous visitor on %s', (collection) => {
  const policy = collectionPolicy[collection]

  it(`read: ${policy?.read}`, async () => {
    const read = payload.find({ collection, limit: 1, overrideAccess: false })

    if (policy.read === 'editors') {
      await expect(read).rejects.toBeInstanceOf(Forbidden)
    } else {
      await expect(read).resolves.toBeDefined()
    }
  })

  it(`create: ${policy?.create}`, async () => {
    // Empty data: an allowed create gets past access and fails validation
    // instead, so nothing is written either way.
    const create = payload.create({ collection, data: {} as never, overrideAccess: false })

    await expect(create).rejects.toBeInstanceOf(
      policy.create === 'anyone' ? ValidationError : Forbidden,
    )
  })

  it('update: editors only', async () => {
    await expect(
      payload.update({ collection, data: {}, overrideAccess: false, where: everyDocument }),
    ).rejects.toBeInstanceOf(Forbidden)
  })

  it('delete: editors only', async () => {
    await expect(
      payload.delete({ collection, overrideAccess: false, where: everyDocument }),
    ).rejects.toBeInstanceOf(Forbidden)
  })
})

describe.each(globals)('anonymous visitor on the %s global', (slug) => {
  it('can read it', async () => {
    await expect(payload.findGlobal({ slug, overrideAccess: false })).resolves.toBeDefined()
  })

  it('cannot update it', async () => {
    await expect(
      payload.updateGlobal({ slug, data: {}, overrideAccess: false }),
    ).rejects.toBeInstanceOf(Forbidden)
  })
})

// What each collection calls its slug-like field, to tell the seeded
// documents apart from whatever else the database holds.
const draftable = {
  education: { field: 'degree', noun: 'education' },
  experiences: { field: 'position', noun: 'experience' },
  journal: { field: 'slug', noun: 'entry' },
  projects: { field: 'slug', noun: 'project' },
} as const

describe.each(Object.keys(draftable) as (keyof typeof draftable)[])(
  'draft documents in %s',
  (collection) => {
    const { field, noun } = draftable[collection]
    const draftName = `access-draft-${noun}`
    const publishedName = `access-published-${noun}`

    const namesOf = (docs: object[]) =>
      docs
        .map((doc) => (doc as Record<string, string>)[field]!)
        .filter((name) => name.startsWith('access-'))
        .sort()

    it('are left out of an anonymous list', async () => {
      const { docs } = await payload.find({ collection, limit: 0, overrideAccess: false })

      expect(namesOf(docs)).toEqual([publishedName])
    })

    it('stay hidden when the query asks for them explicitly', async () => {
      const { docs, totalDocs } = await payload.find({
        collection,
        overrideAccess: false,
        where: { _status: { equals: 'draft' } },
      })

      expect(docs).toEqual([])
      expect(totalDocs).toBe(0)
    })

    it('are left out of an anonymous count', async () => {
      const { totalDocs } = await payload.count({
        collection,
        overrideAccess: false,
        where: { [field]: { like: 'access-' } },
      })

      expect(totalDocs).toBe(1)
    })

    it('cannot be fetched by id', async () => {
      const {
        docs: [hidden],
      } = await payload.find({ collection, where: { [field]: { equals: draftName } } })

      expect(hidden).toBeDefined()
      await expect(
        payload.findByID({ collection, id: hidden!.id, overrideAccess: false }),
      ).rejects.toBeInstanceOf(NotFound)
    })

    it('are listed for a logged-in editor', async () => {
      const { docs } = await payload.find({
        collection,
        limit: 0,
        overrideAccess: false,
        user: editor,
      })

      expect(namesOf(docs)).toEqual([draftName, publishedName])
    })
  },
)

/**
 * `messages` is the one collection a visitor can write to, and the REST
 * endpoint skips everything the contact form's server action checks (the
 * honeypot, the length limits). The collection's own validation is all that
 * stands in the way there.
 */
describe('anonymous message submissions', () => {
  // 254 characters is the RFC 5321 ceiling the collection enforces. Built from
  // short labels so no other email rule (64-char local part, 63-char labels)
  // is what rejects it.
  const emailOfLength = (length: number) => {
    const domain = `${`${'b'.repeat(60)}.`.repeat(4)}com`
    return `${'a'.repeat(length - domain.length - 1)}@${domain}`
  }

  const valid = { email: 'visitor@example.com', message: 'Hello!', name: 'Visitor' }

  const submit = async (
    data: Partial<typeof valid> & { createdAt?: string; read?: boolean; updatedAt?: string },
  ) => {
    const doc = await payload.create({
      collection: 'messages',
      data: { ...valid, ...data },
      overrideAccess: false,
    })

    return track('messages', doc)
  }

  it('accepts a valid message', async () => {
    await expect(submit({})).resolves.toMatchObject(valid)
  })

  it.each([
    ['name', { name: 'n'.repeat(120) }, { name: 'n'.repeat(121) }],
    ['email', { email: emailOfLength(254) }, { email: emailOfLength(255) }],
    ['message', { message: 'm'.repeat(5000) }, { message: 'm'.repeat(5001) }],
  ])('caps %s at its limit', async (path, atLimit, overLimit) => {
    await expect(submit(atLimit)).resolves.toBeDefined()
    await expect(submit(overLimit)).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path })] },
    })
  })

  it('cannot file a message as already read', async () => {
    const doc = await submit({ read: true })

    expect(doc.read).toBe(false)
  })

  // A custom `validate` replaces Payload's email check: these all passed the
  // length-only rule before.
  it.each([
    ['empty', ''],
    ['not an address', 'not-an-address'],
    ['two addresses', 'a@example.com, b@example.com'],
    ['a header smuggled in', 'a@example.com\r\nBcc: b@example.com'],
  ])('refuses an email that is %s', async (_, email) => {
    await expect(submit({ email })).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'email' })] },
    })
  })

  it('dates the message itself', async () => {
    const doc = await submit({
      createdAt: '9999-12-31T00:00:00.000Z',
      updatedAt: '9999-12-31T00:00:00.000Z',
    })

    expect(new Date(doc.createdAt).getFullYear()).toBeLessThan(9999)
    expect(new Date(doc.updatedAt).getFullYear()).toBeLessThan(9999)
  })

  it('still lets an editor mark an older message with a malformed address as read', async () => {
    // Written straight to the database, as a visitor could before the check.
    const legacy = track(
      'messages',
      await payload.db.create({
        collection: 'messages',
        data: { email: 'not-an-address', message: 'Old spam', name: 'Spam', read: false },
      }),
    )

    await expect(
      payload.update({
        collection: 'messages',
        data: { read: true },
        id: legacy.id,
        overrideAccess: false,
        user: editor,
      }),
    ).resolves.toMatchObject({ read: true })
  })
})

/**
 * Rich text may point at public content only, and the reference stays an id.
 * By default Lexical let a link or relationship block point at a contact
 * message or an account, and the site's queries (access overridden) filled it
 * in with the whole document — straight into the page's HTML.
 */
describe('references in rich text', () => {
  const withNode = (node: Record<string, unknown>) => ({
    root: {
      children: [node],
      direction: null,
      format: '' as const,
      indent: 0,
      type: 'root',
      version: 1,
    },
  })

  const relationshipTo = (relationTo: string, value: number) =>
    withNode({ format: '', relationTo, type: 'relationship', value, version: 2 })

  const internalLinkTo = (relationTo: string, value: number) =>
    withNode({
      children: [
        { detail: 0, format: 0, mode: 'normal', style: '', text: 'link', type: 'text', version: 1 },
      ],
      direction: null,
      fields: { doc: { relationTo, value }, linkType: 'internal', newTab: false },
      format: '',
      indent: 0,
      type: 'link',
      version: 3,
    })

  let messageId: number
  let categoryId: number
  let projectId: number

  const publishEntry = async (slug: string, ...nodes: ReturnType<typeof withNode>[]) =>
    track(
      'journal',
      await payload.create({
        collection: 'journal',
        data: {
          _status: 'published',
          category: categoryId,
          content: {
            root: { ...nodes[0]!.root, children: nodes.flatMap((node) => node.root.children) },
          } as never,
          date: '2026-01-01T00:00:00.000Z',
          shortDescription: 'Short description.',
          slug,
          title: slug,
        },
        overrideAccess: false,
        user: editor,
      }),
    )

  beforeAll(async () => {
    messageId = track(
      'messages',
      await payload.create({
        collection: 'messages',
        data: { email: 'private@example.com', message: 'Private.', name: 'Private' },
      }),
    ).id

    categoryId = (
      await payload.find({
        collection: 'categories',
        limit: 1,
        where: { slug: { equals: 'access-journal' } },
      })
    ).docs[0]!.id

    projectId = (
      await payload.find({
        collection: 'projects',
        limit: 1,
        where: { slug: { equals: 'access-published-project' } },
      })
    ).docs[0]!.id
  })

  it.each([
    ['a message', () => relationshipTo('messages', messageId)],
    ['an account', () => relationshipTo('users', editor.id as number)],
  ])('cannot publish a relationship block to %s', async (_, node) => {
    await expect(publishEntry('access-private-block', node())).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'content' })] },
    })
  })

  // Payload doesn't check an internal link's target against the allowed list
  // (3.92), so such a link can still be saved. What matters is that nobody
  // reads the document behind it: the reference stays an id.
  it.each([
    ['a message', 'messages', () => messageId],
    ['an account', 'users', () => editor.id as number],
  ])('never fills in an internal link to %s', async (label, relationTo, id) => {
    const entry = await publishEntry(
      `access-private-link-${relationTo}`,
      internalLinkTo(relationTo, id()),
    )

    // The site's own read: Local API, access overridden, depth 2.
    const read = await payload.findByID({ collection: 'journal', depth: 2, id: entry.id })
    const [link] = (read.content as unknown as ReturnType<typeof withNode>).root.children as {
      fields: { doc: { value: unknown } }
    }[]

    expect(link!.fields.doc.value, label).toBe(id())
    expect(JSON.stringify(read)).not.toContain('private@example.com')
  })

  it('keeps a reference to public content as a bare id', async () => {
    const entry = await publishEntry(
      'access-references-entry',
      relationshipTo('projects', projectId),
      internalLinkTo('projects', projectId),
    )

    // The site's own read: Local API, access overridden, depth 2.
    const read = await payload.findByID({ collection: 'journal', depth: 2, id: entry.id })
    const [block, link] = (read.content as unknown as ReturnType<typeof withNode>).root
      .children as {
      fields?: { doc: { value: unknown } }
      value?: unknown
    }[]

    expect(block!.value).toBe(projectId)
    expect(link!.fields!.doc.value).toBe(projectId)
  })
})

/** Endpoints the site never uses, so nobody needs them open. */
describe('unused endpoints', () => {
  it('disables GraphQL', () => {
    expect(config.graphQL.disable).toBe(true)
  })

  it('removes the import preview, which parsed an uploaded file for anyone', async () => {
    const csv = Buffer.from('title\nx\n').toString('base64')
    const response = await handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/imports/preview-data', {
        body: JSON.stringify({ collectionSlug: 'projects', fileData: csv, format: 'csv' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(await response.text()).not.toContain('"docs"')
  })
})
