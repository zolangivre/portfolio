import { revalidateTag } from 'next/cache'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * Drafts on the content collections: what a visitor can read while an editor
 * is mid-edit, and the scheduled publication the daily cron triggers.
 * Anonymous reads go through the REST handler itself (same code path as
 * /api/<collection>), the rest through the Local API.
 */

// Outside a Next request revalidateTag throws and the hooks swallow it; a
// mock lets the revalidation tests below see the calls.
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const config = await configPromise

const EDITOR = { email: 'drafts-editor@test.local', password: 'drafts-editor' }

let payload: Payload
let editorToken: string
let editorId: number
const projectIds: number[] = []

const createProject = async (slug: string, status: 'published' | 'draft', title = slug) => {
  const doc = await payload.create({
    collection: 'projects',
    data: {
      _status: status,
      description: textToLexicalParagraphs('Description.'),
      shortDescription: 'Short description.',
      slug,
      title,
    },
  })
  projectIds.push(doc.id)
  return doc
}

const rest = (path: string, init: RequestInit = {}) =>
  handleEndpoints({ config, request: new Request(`http://localhost:3000/api${path}`, init) })

const slugsFromRest = async (response: Response) => {
  const body = (await response.json()) as { docs: { slug: string }[] }
  return body.docs.map((doc) => doc.slug).sort()
}

const publishedSlugs = async (prefix: string) => {
  const { docs } = await payload.find({
    collection: 'projects',
    limit: 0,
    overrideAccess: false,
    where: { slug: { like: prefix } },
  })
  return docs.map((doc) => doc.slug).sort()
}

beforeAll(async () => {
  payload = await getPayload({ config })

  const user = await payload.create({ collection: 'users', data: EDITOR })
  editorId = user.id
  const login = await payload.login({ collection: 'users', data: EDITOR })
  editorToken = login.token!
})

afterAll(async () => {
  for (const id of projectIds) {
    await payload.delete({ collection: 'projects', id })
  }
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

describe('reading drafts over REST', () => {
  beforeAll(async () => {
    await createProject('drafts-rest-published', 'published')
    await createProject('drafts-rest-draft', 'draft')
  })

  const list = '/projects?limit=0&where[slug][like]=drafts-rest-'

  it('does not show a draft to an anonymous caller', async () => {
    const response = await rest(list)

    expect(response.status).toBe(200)
    expect(await slugsFromRest(response)).toEqual(['drafts-rest-published'])
  })

  it('does not show a draft to an anonymous caller who asks for drafts', async () => {
    const response = await rest(`${list}&draft=true`)

    expect(await slugsFromRest(response)).toEqual(['drafts-rest-published'])
  })

  it('shows the draft to a logged-in editor', async () => {
    const response = await rest(list, { headers: { Authorization: `JWT ${editorToken}` } })

    expect(response.status).toBe(200)
    expect(await slugsFromRest(response)).toEqual(['drafts-rest-draft', 'drafts-rest-published'])
  })
})

describe('saving a draft over a published document', () => {
  it('leaves what visitors read untouched', async () => {
    const doc = await createProject('drafts-over-published', 'published', 'Published title')

    await payload.update({
      collection: 'projects',
      data: { title: 'Draft title' },
      draft: true,
      id: doc.id,
    })

    // Visitor: the published text, whether or not access is enforced.
    const visitor = await payload.findByID({
      collection: 'projects',
      id: doc.id,
      overrideAccess: false,
    })
    expect(visitor.title).toBe('Published title')
    expect(visitor._status).toBe('published')

    const site = await payload.find({
      collection: 'projects',
      where: { slug: { equals: 'drafts-over-published' } },
    })
    expect(site.docs[0]?.title).toBe('Published title')

    // Editor opening the document sees the draft.
    const editing = await payload.findByID({
      collection: 'projects',
      draft: true,
      id: doc.id,
    })
    expect(editing.title).toBe('Draft title')
  })

  it('keeps a first-time draft hidden after it is autosaved again', async () => {
    const doc = await createProject('drafts-never-published', 'draft')

    await payload.update({
      collection: 'projects',
      data: { title: 'Autosaved' },
      draft: true,
      id: doc.id,
    })

    expect(await publishedSlugs('drafts-never-')).toEqual([])
  })
})

describe('revalidating the site around drafts', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear()
  })

  it('does not revalidate while autosaving over a published document', async () => {
    const doc = await createProject('drafts-reval-autosave', 'published')
    vi.mocked(revalidateTag).mockClear()

    for (const title of ['First autosave', 'Second autosave']) {
      await payload.update({
        autosave: true,
        collection: 'projects',
        data: { title },
        draft: true,
        id: doc.id,
      })
    }

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates when a document is unpublished after an autosave', async () => {
    const doc = await createProject('drafts-reval-unpublish', 'published')

    await payload.update({
      autosave: true,
      collection: 'projects',
      data: { title: 'Autosaved' },
      draft: true,
      id: doc.id,
    })
    vi.mocked(revalidateTag).mockClear()

    await payload.update({ collection: 'projects', data: { _status: 'draft' }, id: doc.id })

    expect(await publishedSlugs('drafts-reval-unpublish')).toEqual([])
    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })
  })
})

describe('reordering a document that has a pending draft', () => {
  it('moves the published row too, so the list and the site follow', async () => {
    const first = await createProject('drafts-reorder-first', 'published')
    const second = await createProject('drafts-reorder-second', 'published')
    // An unpublished autosave: Payload's reorder now saves this one as a draft.
    await payload.update({
      autosave: true,
      collection: 'projects',
      data: { title: 'Pending edit' },
      draft: true,
      id: first.id,
    })
    const [before] = (
      await payload.find({
        collection: 'projects',
        sort: '_order',
        where: { id: { in: [first.id, second.id] } },
      })
    ).docs
    // New documents land on top, so `second` comes first; move `first` above it.
    expect(before?.id).toBe(second.id)
    vi.mocked(revalidateTag).mockClear()

    const response = await rest('/reorder', {
      body: JSON.stringify({
        collectionSlug: 'projects',
        docsToMove: [first.id],
        newKeyWillBe: 'less',
        orderableFieldName: '_order',
        target: { id: second.id, key: before?._order },
      }),
      headers: { Authorization: `JWT ${editorToken}`, 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(response.status).toBe(200)

    const after = await payload.find({
      collection: 'projects',
      sort: '_order',
      where: { id: { in: [first.id, second.id] } },
    })
    expect(after.docs.map((doc) => doc.id)).toEqual([first.id, second.id])
    // Still the published text: only the order reached the main row.
    expect(after.docs[0]?.title).toBe('drafts-reorder-first')
    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })
  })
})

describe('/api/payload-jobs/run access', () => {
  const run = (headers: Record<string, string> = {}) =>
    rest('/payload-jobs/run?allQueues=true', { headers, method: 'GET' })

  const original = process.env.CRON_SECRET

  afterAll(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  describe('with CRON_SECRET set', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'drafts-cron-secret'
    })

    it('refuses an anonymous caller', async () => {
      expect([401, 403]).toContain((await run()).status)
    })

    it('accepts the cron with the right bearer token', async () => {
      expect((await run({ Authorization: 'Bearer drafts-cron-secret' })).status).toBe(200)
    })

    it('refuses a wrong token', async () => {
      expect([401, 403]).toContain((await run({ Authorization: 'Bearer nope' })).status)
    })

    it('accepts a logged-in editor', async () => {
      expect((await run({ Authorization: `JWT ${editorToken}` })).status).toBe(200)
    })
  })

  describe('without CRON_SECRET', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET
    })

    it('refuses an anonymous caller, even with an empty bearer token', async () => {
      expect([401, 403]).toContain((await run()).status)
      expect([401, 403]).toContain((await run({ Authorization: 'Bearer ' })).status)
      expect([401, 403]).toContain((await run({ Authorization: 'Bearer undefined' })).status)
    })

    it('still accepts a logged-in editor', async () => {
      expect((await run({ Authorization: `JWT ${editorToken}` })).status).toBe(200)
    })
  })
})

describe('scheduled publication', () => {
  const queueSchedule = async (id: number, type: 'publish' | 'unpublish', waitUntil: Date) => {
    await payload.jobs.queue({
      input: { doc: { relationTo: 'projects', value: id }, type },
      task: 'schedulePublish',
      waitUntil,
    })
  }

  const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000)
  const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000)

  it('publishes a draft once its date has passed and the jobs run', async () => {
    const doc = await createProject('drafts-scheduled-publish', 'draft')
    expect(await publishedSlugs('drafts-scheduled-publish')).toEqual([])

    await queueSchedule(doc.id, 'publish', yesterday())
    await payload.jobs.run()

    expect(await publishedSlugs('drafts-scheduled-publish')).toEqual(['drafts-scheduled-publish'])
  })

  it('leaves the draft alone while the date is still ahead', async () => {
    const doc = await createProject('drafts-scheduled-later', 'draft')

    await queueSchedule(doc.id, 'publish', tomorrow())
    await payload.jobs.run()

    expect(await publishedSlugs('drafts-scheduled-later')).toEqual([])
  })

  it('unpublishes a published document on schedule', async () => {
    const doc = await createProject('drafts-scheduled-unpublish', 'published')
    expect(await publishedSlugs('drafts-scheduled-unpublish')).toEqual([
      'drafts-scheduled-unpublish',
    ])

    await queueSchedule(doc.id, 'unpublish', yesterday())
    await payload.jobs.run()

    expect(await publishedSlugs('drafts-scheduled-unpublish')).toEqual([])
  })
})
