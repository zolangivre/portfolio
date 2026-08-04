import { defaultLocale, locales, type Locale } from './locale'

/**
 * Shared config for Payload's preview features. Both the "Preview" button and
 * Live Preview point at /next/preview, which enables Next.js draft mode and
 * then redirects to the real page — so preview renders the actual site, not a
 * separate copy of it.
 */

export type PreviewCollection = 'projects' | 'journal'

/** Front-end path a document is rendered at, per collection. */
const PATH_BY_COLLECTION: Record<PreviewCollection, (locale: Locale, slug: string) => string> = {
  projects: (locale, slug) => `/${locale}/projects/${slug}`,
  journal: (locale, slug) => `/${locale}/journal/${slug}`,
}

function resolveLocale(locale: unknown): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

/**
 * Server URL used to build absolute preview links. Vercel sets VERCEL_URL on
 * every deployment (without protocol), which keeps preview working on branch
 * deploys where the production domain is wrong.
 */
export function getServerURL(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

/** Builds the /next/preview URL that flips draft mode on before redirecting. */
export function buildPreviewURL({
  collection,
  slug,
  locale,
}: {
  collection: PreviewCollection
  slug: string | undefined
  locale: unknown
}): string {
  const resolvedLocale = resolveLocale(locale)

  // A doc with no slug yet (brand new, never saved) has nothing to render.
  if (!slug) {
    return `${getServerURL()}/${resolvedLocale}`
  }

  const path = PATH_BY_COLLECTION[collection](resolvedLocale, slug)

  const params = new URLSearchParams({
    path,
    collection,
    slug,
    locale: resolvedLocale,
  })

  return `${getServerURL()}/next/preview?${params.toString()}`
}
