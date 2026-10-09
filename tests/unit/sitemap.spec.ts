import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAllProjects, getJournalEntries, getSectionsVisibility } from '@/lib/queries'

vi.mock('@/lib/queries', () => ({
  getAllProjects: vi.fn(),
  getJournalEntries: vi.fn(),
  getSectionsVisibility: vi.fn(),
}))

// The site url is read when the module loads, so it has to be set first.
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://site.test')
const { default: sitemap } = await import('@/app/sitemap')

const project = (slug: string, updatedAt: string) => ({ slug, updatedAt }) as never
const entry = (slug: string, updatedAt: string) => ({ slug, updatedAt }) as never

const urls = async () => (await sitemap()).map((item) => item.url)
const byUrl = async (url: string) => (await sitemap()).find((item) => item.url === url)

beforeEach(() => {
  vi.mocked(getSectionsVisibility).mockResolvedValue({ journal: true, projects: true } as never)
  vi.mocked(getAllProjects).mockResolvedValue([
    project('alpha', '2026-03-01T00:00:00.000Z'),
    project('beta', '2026-05-01T00:00:00.000Z'),
  ])
  vi.mocked(getJournalEntries).mockResolvedValue([entry('trip', '2026-04-01T00:00:00.000Z')])
})

describe('sitemap', () => {
  it('lists every public page in both locales', async () => {
    expect(await urls()).toEqual(
      ['fr', 'en'].flatMap((locale) => [
        `https://site.test/${locale}`,
        `https://site.test/${locale}/projects/alpha`,
        `https://site.test/${locale}/projects/beta`,
        `https://site.test/${locale}/journal`,
        `https://site.test/${locale}/journal/trip`,
      ]),
    )
  })

  it('reads each locale from its own queries', async () => {
    await sitemap()

    expect(vi.mocked(getAllProjects).mock.calls).toEqual([['fr'], ['en']])
    expect(vi.mocked(getJournalEntries).mock.calls).toEqual([['fr'], ['en']])
  })

  it('links every page to its translation', async () => {
    expect((await byUrl('https://site.test/en/projects/alpha'))?.alternates).toEqual({
      languages: {
        en: 'https://site.test/en/projects/alpha',
        fr: 'https://site.test/fr/projects/alpha',
      },
    })
  })

  it.each(['projects', 'journal'] as const)(
    'leaves out %s when the section is turned off',
    async (section) => {
      vi.mocked(getSectionsVisibility).mockResolvedValue({ [section]: false } as never)

      const listed = await urls()

      expect(listed.some((url) => url.includes(`/${section}`))).toBe(false)
      expect(listed).toContain('https://site.test/fr')
    },
  )

  it('keeps every section when the visibility settings failed to load', async () => {
    vi.mocked(getSectionsVisibility).mockResolvedValue(null)

    expect(await urls()).toHaveLength(10)
  })

  it('dates each index page by its most recent entry', async () => {
    expect((await byUrl('https://site.test/fr'))?.lastModified).toEqual(
      new Date('2026-05-01T00:00:00.000Z'),
    )
    expect((await byUrl('https://site.test/fr/journal'))?.lastModified).toEqual(
      new Date('2026-04-01T00:00:00.000Z'),
    )
  })

  it('omits dates it cannot parse', async () => {
    vi.mocked(getAllProjects).mockResolvedValue([project('alpha', 'not a date')])
    vi.mocked(getJournalEntries).mockResolvedValue([])

    expect((await byUrl('https://site.test/fr/projects/alpha'))?.lastModified).toBeUndefined()
    expect((await byUrl('https://site.test/fr'))?.lastModified).toBeUndefined()
  })
})
