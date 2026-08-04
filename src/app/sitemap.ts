import type { MetadataRoute } from 'next'

import { locales } from '@/lib/locale'
import { getAllProjects, getJournalEntries } from '@/lib/queries'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

/**
 * Previously this listed only the two locale roots, so no project or journal
 * page was ever declared. Detail pages are now included, each with its real
 * lastModified and its cross-locale alternates.
 *
 * The queries used here are the same published-only ones the pages use, so a
 * draft can never leak into the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeAlternates = Object.fromEntries(
    locales.map((locale) => [locale, `${siteUrl}/${locale}`]),
  )

  const entries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
    alternates: { languages: homeAlternates },
  }))

  for (const locale of locales) {
    entries.push({
      url: `${siteUrl}/${locale}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}/journal`])),
      },
    })
  }

  // A slug is not localized in this schema, so the same document is reachable
  // under every locale — which is exactly what the alternates should say.
  for (const locale of locales) {
    const [projects, journal] = await Promise.all([
      getAllProjects(locale),
      getJournalEntries(locale),
    ])

    for (const project of projects) {
      entries.push({
        url: `${siteUrl}/${locale}/projects/${project.slug}`,
        lastModified: new Date(project.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${siteUrl}/${l}/projects/${project.slug}`]),
          ),
        },
      })
    }

    for (const entry of journal) {
      entries.push({
        url: `${siteUrl}/${locale}/journal/${entry.slug}`,
        lastModified: new Date(entry.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${siteUrl}/${l}/journal/${entry.slug}`]),
          ),
        },
      })
    }
  }

  return entries
}
