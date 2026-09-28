import {
  Forbidden,
  getPayload,
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
  | 'public-only' // visitors see `visibility: 'public'` documents only
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
    education: { read: 'anyone', create: 'editors' },
    experiences: { read: 'anyone', create: 'editors' },
    journal: { read: 'public-only', create: 'editors' },
    media: { read: 'editors', create: 'editors' },
    messages: { read: 'editors', create: 'anyone' },
    'payload-kv': { read: 'editors', create: 'editors' },
    'payload-locked-documents': { read: 'editors', create: 'editors' },
    'payload-migrations': { read: 'editors', create: 'editors' },
    'payload-preferences': { read: 'editors', create: 'editors' },
    projects: { read: 'public-only', create: 'editors' },
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

  for (const visibility of ['public', 'private'] as const) {
    track(
      'projects',
      await payload.create({
        collection: 'projects',
        data: {
          description: textToLexicalParagraphs('Description.'),
          shortDescription: 'Short description.',
          slug: `access-${visibility}-project`,
          title: `Access ${visibility} project`,
          visibility,
        },
      }),
    )

    track(
      'journal',
      await payload.create({
        collection: 'journal',
        data: {
          category: category.id,
          content: textToLexicalParagraphs('Content.'),
          date: '2026-01-01T00:00:00.000Z',
          shortDescription: 'Short description.',
          slug: `access-${visibility}-entry`,
          title: `Access ${visibility} entry`,
          visibility,
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

describe.each(['projects', 'journal'] as const)('private documents in %s', (collection) => {
  const slugsOf = (docs: { slug: string }[]) =>
    docs
      .map((doc) => doc.slug)
      .filter((slug) => slug.startsWith('access-'))
      .sort()

  const privateSlug = collection === 'projects' ? 'access-private-project' : 'access-private-entry'
  const publicSlug = collection === 'projects' ? 'access-public-project' : 'access-public-entry'

  it('are left out of an anonymous list', async () => {
    const { docs } = await payload.find({ collection, overrideAccess: false })

    expect(slugsOf(docs)).toEqual([publicSlug])
  })

  it('stay hidden when the query asks for them explicitly', async () => {
    const { docs, totalDocs } = await payload.find({
      collection,
      overrideAccess: false,
      where: { visibility: { equals: 'private' } },
    })

    expect(docs).toEqual([])
    expect(totalDocs).toBe(0)
  })

  it('are left out of an anonymous count', async () => {
    const { totalDocs } = await payload.count({
      collection,
      overrideAccess: false,
      where: { slug: { like: 'access-' } },
    })

    expect(totalDocs).toBe(1)
  })

  it('cannot be fetched by id', async () => {
    const {
      docs: [hidden],
    } = await payload.find({ collection, where: { slug: { equals: privateSlug } } })

    expect(hidden).toBeDefined()
    await expect(
      payload.findByID({ collection, id: hidden!.id, overrideAccess: false }),
    ).rejects.toBeInstanceOf(NotFound)
  })

  it('are listed for a logged-in editor', async () => {
    const { docs } = await payload.find({ collection, overrideAccess: false, user: editor })

    expect(slugsOf(docs)).toEqual([privateSlug, publicSlug])
  })
})

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

  const submit = async (data: Partial<typeof valid> & { read?: boolean }) => {
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
})
