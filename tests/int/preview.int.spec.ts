import { draftMode, headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  getAbout,
  getAllProjects,
  getFooter,
  getHero,
  getJournalEntries,
  getJournalEntry,
  getProject,
} from '@/lib/queries'
import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * What the site's query functions read: the published content for a visitor,
 * the pending drafts when Draft Mode is on (the Live Preview of the admin).
 */

// The queries wrap their reads in unstable_cache, which needs a Next server:
// a pass-through keeps the read itself. Outside a request revalidateTag throws
// and the hooks swallow it; a mock keeps them quiet.
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) =>
    (...args: Args) =>
      fn(...args),
}))

vi.mock('next/headers', () => ({ draftMode: vi.fn(), headers: vi.fn() }))

// `draftMode()` is async in Next 16; the object also answers a synchronous
// read, so the test doesn't depend on how the code under test awaits it.
const setDraftMode = (isEnabled: boolean) => {
  vi.mocked(draftMode).mockReturnValue(
    Object.assign(Promise.resolve({ isEnabled }), { isEnabled }) as never,
  )
}

const config = await configPromise

let payload: Payload
const projectIds: number[] = []
const journalIds: number[] = []

type GlobalCase = {
  slug: 'hero' | 'about' | 'footer'
  key: string
  read: () => Promise<unknown>
}

const globals: GlobalCase[] = [
  { key: 'title', read: () => getHero('fr'), slug: 'hero' },
  { key: 'title', read: () => getAbout('fr'), slug: 'about' },
  { key: 'text', read: () => getFooter('fr'), slug: 'footer' },
]
const originals = new Map<string, unknown>()

const EDITOR = { email: 'preview-editor@test.local', password: 'preview-editor' }
let editorId: number

beforeAll(async () => {
  payload = await getPayload({ config })

  // Draft Mode only reads drafts for a logged-in editor (isPreview checks the
  // session): the request headers carry this editor's token.
  editorId = (await payload.create({ collection: 'users', data: EDITOR })).id
  const { token } = await payload.login({ collection: 'users', data: EDITOR })
  vi.mocked(headers).mockResolvedValue(new Headers({ Authorization: `JWT ${token}` }) as never)

  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 1,
    where: { group: { equals: 'journal' } },
  })
  const category = categories[0]!.id

  const project = async (slug: string, _status: 'draft' | 'published', title: string) => {
    const doc = await payload.create({
      collection: 'projects',
      data: {
        _status,
        description: textToLexicalParagraphs('Description.'),
        shortDescription: 'Short description.',
        slug,
        title,
      },
      locale: 'fr',
    })
    projectIds.push(doc.id)
    return doc
  }
  const entry = async (slug: string, _status: 'draft' | 'published', title: string) => {
    const doc = await payload.create({
      collection: 'journal',
      data: {
        _status,
        category,
        content: textToLexicalParagraphs('Contenu.'),
        date: '2026-01-15T00:00:00.000Z',
        shortDescription: 'Short description.',
        slug,
        title,
      },
      locale: 'fr',
    })
    journalIds.push(doc.id)
    return doc
  }

  const published = await project('preview-published', 'published', 'Published project')
  await payload.update({
    collection: 'projects',
    data: { title: 'Edited project (draft)' },
    draft: true,
    id: published.id,
    locale: 'fr',
  })
  await project('preview-never-published', 'draft', 'Never published project')

  const publishedEntry = await entry('preview-entry', 'published', 'Published entry')
  await payload.update({
    collection: 'journal',
    data: { title: 'Edited entry (draft)' },
    draft: true,
    id: publishedEntry.id,
    locale: 'fr',
  })
  await entry('preview-entry-never-published', 'draft', 'Never published entry')

  for (const { slug, key } of globals) {
    originals.set(slug, (await payload.findGlobal({ slug })) as unknown as Record<string, unknown>)
    await payload.updateGlobal({
      slug,
      data: { [key]: 'Published global', _status: 'published' } as never,
    })
    await payload.updateGlobal({ slug, data: { [key]: 'Draft global' } as never, draft: true })
  }
})

afterAll(async () => {
  for (const id of projectIds) await payload.delete({ collection: 'projects', id })
  for (const id of journalIds) await payload.delete({ collection: 'journal', id })
  for (const { slug, key } of globals) {
    const before = originals.get(slug) as Record<string, unknown> | undefined
    // A global never saved here reads as its defaults, which can break their
    // own validation (see draftGlobals.int.spec.ts): leaving the value is fine.
    await payload
      .updateGlobal({ slug, data: { [key]: before?.[key], _status: 'published' } as never })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'ValidationError') throw error
      })
  }
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

const titles = (docs: { title: string }[]) => docs.map((doc) => doc.title)

describe('outside Draft Mode', () => {
  beforeAll(() => setDraftMode(false))

  it('lists only published projects, with their published title', async () => {
    const list = titles(await getAllProjects('fr'))

    expect(list).toContain('Published project')
    expect(list).not.toContain('Edited project (draft)')
    expect(list).not.toContain('Never published project')
  })

  it('does not find a never-published project by its slug', async () => {
    expect(await getProject('preview-never-published', 'fr')).toBeNull()
    expect((await getProject('preview-published', 'fr'))?.title).toBe('Published project')
  })

  it('lists only published journal entries', async () => {
    const list = titles(await getJournalEntries('fr'))

    expect(list).toContain('Published entry')
    expect(list).not.toContain('Edited entry (draft)')
    expect(list).not.toContain('Never published entry')
    expect(await getJournalEntry('preview-entry-never-published', 'fr')).toBeNull()
    expect((await getJournalEntry('preview-entry', 'fr'))?.title).toBe('Published entry')
  })

  it.each(globals)('reads the published $slug', async ({ key, read }) => {
    expect(((await read()) as Record<string, unknown>)[key]).toBe('Published global')
  })
})

describe('in Draft Mode', () => {
  beforeAll(() => setDraftMode(true))

  it('lists the draft of a published project and a never-published project', async () => {
    const list = titles(await getAllProjects('fr'))

    expect(list).toContain('Edited project (draft)')
    expect(list).toContain('Never published project')
    expect(list).not.toContain('Published project')
  })

  it('finds a never-published project by its slug', async () => {
    expect((await getProject('preview-never-published', 'fr'))?.title).toBe(
      'Never published project',
    )
    expect((await getProject('preview-published', 'fr'))?.title).toBe('Edited project (draft)')
  })

  it('lists and finds the journal drafts', async () => {
    const list = titles(await getJournalEntries('fr'))

    expect(list).toContain('Edited entry (draft)')
    expect(list).toContain('Never published entry')
    expect((await getJournalEntry('preview-entry-never-published', 'fr'))?.title).toBe(
      'Never published entry',
    )
    expect((await getJournalEntry('preview-entry', 'fr'))?.title).toBe('Edited entry (draft)')
  })

  it.each(globals)('reads the draft of the $slug global', async ({ key, read }) => {
    expect(((await read()) as Record<string, unknown>)[key]).toBe('Draft global')
  })
})
