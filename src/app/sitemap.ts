import type { MetadataRoute } from 'next'

import { locales } from '@/lib/locale'
import { getAllProjects, getJournalEntries } from '@/lib/queries'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Most recent content change across the site.
 *
 * This used to be `new Date()`, which froze to the build date and told crawlers
 * the site had changed every time it was deployed — whether or not any content
 * had. `updatedAt` is not localized, so reading the default locale is enough.
 */
async function getLastModified(): Promise<Date | undefined> {
  const [projects, entries] = await Promise.all([getAllProjects(), getJournalEntries()])

  const timestamps = [...projects, ...entries]
    .map((doc) => Date.parse(doc.updatedAt))
    .filter((value) => Number.isFinite(value))

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}`]))
  const lastModified = await getLastModified()

  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 1,
    alternates: {
      languages,
    },
  }))
}
