import type { MetadataRoute } from 'next'

import { locales, type Locale } from '@/lib/locale'
import { getAllProjects, getJournalEntries, getSectionsVisibility } from '@/lib/queries'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Entry = MetadataRoute.Sitemap[number]

function parseDate(value: string | null | undefined): Date | undefined {
  const timestamp = value ? Date.parse(value) : Number.NaN

  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined
}

function mostRecent(values: (string | null | undefined)[]): Date | undefined {
  const timestamps = values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((timestamp) => Number.isFinite(timestamp))

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined
}

/**
 * Builds the `alternates.languages` map for one path.
 *
 * The path is the same in every locale (only the prefix changes), so a page's
 * translations are always derivable from its own URL — there is no per-locale
 * slug to look up.
 */
function alternates(path: string): Entry['alternates'] {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`]),
    ),
  }
}

/**
 * Every public URL of the site, in both locales.
 *
 * Detail pages used to be missing here — the sitemap only listed the two
 * homepages, so nothing under /projects/* or /journal/* was ever announced to
 * crawlers. Sections turned off in Payload are skipped: their routes call
 * `notFound()`, and a sitemap entry pointing at a 404 is worse than no entry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: Entry[] = []

  for (const locale of locales as readonly Locale[]) {
    const [sections, projects, journalEntries] = await Promise.all([
      getSectionsVisibility(locale),
      getAllProjects(locale),
      getJournalEntries(locale),
    ])

    const projectsVisible = sections?.projects !== false
    const journalVisible = sections?.journal !== false

    entries.push({
      url: `${siteUrl}/${locale}`,
      lastModified: mostRecent(
        [...projects, ...journalEntries].map((doc) => doc.updatedAt),
      ),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: alternates(''),
    })

    if (projectsVisible) {
      entries.push({
        url: `${siteUrl}/${locale}/projects`,
        lastModified: mostRecent(projects.map((project) => project.updatedAt)),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: alternates('/projects'),
      })

      for (const project of projects) {
        entries.push({
          url: `${siteUrl}/${locale}/projects/${project.slug}`,
          lastModified: parseDate(project.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: alternates(`/projects/${project.slug}`),
        })
      }
    }

    if (journalVisible) {
      entries.push({
        url: `${siteUrl}/${locale}/journal`,
        lastModified: mostRecent(journalEntries.map((entry) => entry.updatedAt)),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: alternates('/journal'),
      })

      for (const entry of journalEntries) {
        entries.push({
          url: `${siteUrl}/${locale}/journal/${entry.slug}`,
          lastModified: parseDate(entry.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.5,
          alternates: alternates(`/journal/${entry.slug}`),
        })
      }
    }
  }

  return entries
}
