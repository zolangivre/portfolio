import { revalidateTag } from 'next/cache'
import { getPayload, handleEndpoints, type GlobalSlug, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import configPromise from '@/payload.config'

/**
 * Drafts on the eight globals: what a visitor (REST, no access override) and
 * the site (`findGlobal` without `draft`) read while an editor has a pending
 * draft, and the scheduled publication the daily cron triggers.
 *
 * The test database is shared by the whole suite: every global is restored to
 * what it held before in `afterAll`.
 */

// Outside a Next request revalidateTag throws and the hooks swallow it.
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const config = await configPromise

const EDITOR = { email: 'draft-globals-editor@test.local', password: 'draft-globals-editor' }

type Doc = Record<string, unknown>

interface Case {
  slug: GlobalSlug
  /** Top-level keys the case writes, to put them back afterwards. */
  keys: string[]
  /** Where the changed value lives in the document. */
  path: (string | number)[]
  published: unknown
  draft: unknown
  data: (value: unknown) => Doc
}

const text = (slug: GlobalSlug, key: string): Case => ({
  slug,
  data: (value) => ({ [key]: value }),
  draft: 'Draft text',
  keys: [key],
  path: [key],
  published: 'Published text',
})

const cases: Case[] = [
  text('about', 'title'),
  text('contact', 'title'),
  text('footer', 'text'),
  text('settings', 'profession'),
  text('hero', 'title'),
  {
    slug: 'navigation',
    data: (value) => ({ items: [{ href: '/draft-globals', label: value }] }),
    draft: 'Draft label',
    keys: ['items'],
    path: ['items', 0, 'label'],
    published: 'Published label',
  },
  {
    slug: 'sections-content',
    data: (value) => ({ projects: { title: value } }),
    draft: 'Draft title',
    keys: ['projects'],
    path: ['projects', 'title'],
    published: 'Published title',
  },
  {
    slug: 'sections-visibility',
    data: (value) => ({ journal: value }),
    draft: false,
    keys: ['journal'],
    path: ['journal'],
    published: true,
  },
]

const at = (doc: unknown, path: (string | number)[]): unknown =>
  path.reduce<unknown>((value, key) => (value as Record<string | number, unknown>)?.[key], doc)

let payload: Payload
let editorToken: string
let editorId: number

const rest = (path: string, init: RequestInit = {}) =>
  handleEndpoints({ config, request: new Request(`http://localhost:3000/api${path}`, init) })

const asEditor = { headers: { Authorization: '' } }

const restRead = async (slug: GlobalSlug, query = '', editor = false) => {
  const response = await rest(`/globals/${slug}${query}`, editor ? asEditor : {})
  return { response, body: (await response.json()) as Doc }
}

const originals = new Map<GlobalSlug, Doc>()

beforeAll(async () => {
  payload = await getPayload({ config })

  const user = await payload.create({ collection: 'users', data: EDITOR })
  editorId = user.id
  const login = await payload.login({ collection: 'users', data: EDITOR })
  editorToken = login.token!
  asEditor.headers.Authorization = `JWT ${editorToken}`

  for (const { slug } of cases) {
    originals.set(slug, (await payload.findGlobal({ slug })) as unknown as Doc)
  }
})

afterAll(async () => {
  for (const { slug, keys } of cases) {
    const before = originals.get(slug)
    if (before) {
      const data = Object.fromEntries(keys.map((key) => [key, before[key]]))
      // A global never saved in this database reads as its defaults, and the
      // hero's default title (66 characters) breaks its own maxLength of 60,
      // so republishing it is refused. Leaving the test value is harmless.
      await payload
        .updateGlobal({ slug, data: { ...data, _status: 'published' } as never })
        .catch((error: unknown) => {
          if ((error as Error).name !== 'ValidationError') throw error
        })
    }
  }
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

describe.each(cases)('the $slug global', ({ slug, data, draft, path, published }) => {
  beforeAll(async () => {
    await payload.updateGlobal({
      slug,
      data: { ...data(published), _status: 'published' } as never,
    })
  })

  it('is readable by an anonymous REST caller, with its published content', async () => {
    const { response, body } = await restRead(slug)

    expect(response.status).toBe(200)
    expect(at(body, path)).toEqual(published)
  })

  describe('once an editor has saved a draft', () => {
    beforeAll(async () => {
      await payload.updateGlobal({ slug, data: data(draft) as never, draft: true })
    })

    it('still shows the published content to an anonymous caller', async () => {
      const { response, body } = await restRead(slug)

      expect(response.status).toBe(200)
      expect(at(body, path)).toEqual(published)
    })

    it('never shows the draft to an anonymous caller who asks for drafts', async () => {
      const { response, body } = await restRead(slug, '?draft=true')

      expect(response.status).toBe(200)
      expect(at(body, path)).toEqual(published)
    })

    it('shows the draft to a logged-in editor who asks for drafts', async () => {
      const { response, body } = await restRead(slug, '?draft=true', true)

      expect(response.status).toBe(200)
      expect(at(body, path)).toEqual(draft)
    })

    it('shows the published content to an editor who does not ask for drafts', async () => {
      const { body } = await restRead(slug, '', true)

      expect(at(body, path)).toEqual(published)
    })

    it('does not change what the site reads', async () => {
      const site = await payload.findGlobal({ slug })
      const visitor = await payload.findGlobal({ overrideAccess: false, slug })

      expect(at(site, path)).toEqual(published)
      expect(at(visitor, path)).toEqual(published)
    })
  })
})

describe('scheduled publication of a global', () => {
  const queue = async (type: 'publish' | 'unpublish', waitUntil: Date) => {
    await payload.jobs.queue({
      input: { global: 'hero', type },
      task: 'schedulePublish',
      waitUntil,
    })
  }

  const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000)
  const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000)

  const saveDraft = async (title: string) => {
    await payload.updateGlobal({ slug: 'hero', data: { title, _status: 'published' } })
    await payload.updateGlobal({ slug: 'hero', data: { title: `${title} (draft)` }, draft: true })
  }

  it('publishes the draft once its date has passed and the jobs run', async () => {
    await saveDraft('Before schedule')
    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Before schedule')

    await queue('publish', yesterday())
    await payload.jobs.run()

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Before schedule (draft)')
    const { body } = await restRead('hero')
    expect(body.title).toBe('Before schedule (draft)')
  })

  it('leaves the published content alone while the date is still ahead', async () => {
    await saveDraft('Not yet')

    await queue('publish', tomorrow())
    await payload.jobs.run()

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Not yet')
  })

  it('revalidates the site when the cron publishes the draft', async () => {
    await saveDraft('Revalidated')
    vi.mocked(revalidateTag).mockClear()

    await queue('publish', yesterday())
    await payload.jobs.run()

    expect(revalidateTag).toHaveBeenCalledWith('hero', { expire: 0 })
  })

  // The job would write the latest draft into the row the site renders.
  it('refuses to schedule the unpublishing of a global', async () => {
    await saveDraft('Never unpublished')

    await expect(queue('unpublish', yesterday())).rejects.toThrow('Un global ne se dépublie pas')
    await payload.jobs.run()

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Never unpublished')
  })
})

describe('restoring a global from its version history', () => {
  // Restoring writes the version, `draft` status included, into the main
  // row: the site changes even though the doc reads as a draft.
  it('revalidates the site when a draft version is restored', async () => {
    await payload.updateGlobal({ slug: 'hero', data: { title: 'Live', _status: 'published' } })
    await payload.updateGlobal({ slug: 'hero', data: { title: 'Restorable draft' }, draft: true })
    const { docs } = await payload.findGlobalVersions({
      limit: 1,
      slug: 'hero',
      sort: '-updatedAt',
      where: { 'version._status': { equals: 'draft' } },
    })
    vi.mocked(revalidateTag).mockClear()

    await payload.restoreGlobalVersion({ id: docs[0]!.id, slug: 'hero' })

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Restorable draft')
    expect(revalidateTag).toHaveBeenCalledWith('hero', { expire: 0 })
  })

  it('revalidates the site when a version is restored as a draft', async () => {
    await payload.updateGlobal({ slug: 'hero', data: { title: 'Old draft' }, draft: true })
    await payload.updateGlobal({
      slug: 'hero',
      data: { title: 'Live again', _status: 'published' },
    })
    const { docs } = await payload.findGlobalVersions({
      limit: 1,
      slug: 'hero',
      sort: '-updatedAt',
      where: { 'version.title': { equals: 'Old draft' } },
    })
    vi.mocked(revalidateTag).mockClear()

    // The admin's "Restore as draft" is this REST call; the Local API has no
    // `draft` option for a restore.
    const response = await rest(`/globals/hero/versions/${docs[0]!.id}?draft=true`, {
      ...asEditor,
      method: 'POST',
    })
    expect(response.status).toBe(200)

    expect((await payload.findGlobal({ slug: 'hero' })).title).toBe('Old draft')
    expect(revalidateTag).toHaveBeenCalledWith('hero', { expire: 0 })
  })
})
