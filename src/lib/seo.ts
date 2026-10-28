import type { Metadata } from 'next'

import { locales, type Locale } from './locale'

/**
 * Page metadata and JSON-LD shared by the public pages.
 *
 * Next merges metadata shallowly: a page that leaves `alternates`, `openGraph`
 * or `twitter` unset inherits the layout's whole object, which is how every
 * project and journal page ended up declaring the homepage as its canonical
 * and sharing on X with the homepage's title. Each page now builds all three
 * here, from its own path.
 */

export const OG_LOCALES: Record<Locale, string> = { en: 'en_US', fr: 'fr_FR' }

type PageMetadataInput = {
  description?: string | null
  locale: Locale
  /** The path after the locale prefix: `/projects/alpha`, or `''` for the locale root. */
  path: string
  /** Only used for an article. */
  publishedTime?: string | null
  siteName?: string | null
  title: string
  type: 'article' | 'website'
}

/** Relative URLs throughout: the layout's `metadataBase` makes them absolute. */
export function pageMetadata({
  description,
  locale,
  path,
  publishedTime,
  siteName,
  title,
  type,
}: PageMetadataInput): Metadata {
  const url = `/${locale}${path}`
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((entry) => [entry, `/${entry}${path}`]),
  )
  languages['x-default'] = `/fr${path}`

  return {
    title,
    description: description || undefined,
    alternates: { canonical: url, languages },
    // No `images`: the route's `opengraph-image` supplies the card, and a
    // file-based image always wins over this object anyway.
    openGraph: {
      description: description || undefined,
      locale: OG_LOCALES[locale],
      siteName: siteName ?? undefined,
      title,
      url,
      ...(type === 'article'
        ? { type, ...(publishedTime ? { publishedTime } : {}) }
        : { type: 'website' as const }),
    },
    // No `images` either: X falls back to og:image, so every page shares the
    // same card on X as everywhere else.
    twitter: {
      card: 'summary_large_image',
      description: description || undefined,
      title,
    },
  }
}

/** Drops undefined, null and empty values so the JSON never says "undefined". */
function compact<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    ),
  ) as T
}

/** Media urls are usually absolute already (R2); a relative one is made absolute. */
function absoluteUrl(url: string | null | undefined, siteUrl: string): string | undefined {
  if (!url) {
    return undefined
  }

  try {
    return new URL(url, siteUrl).toString()
  } catch {
    return undefined
  }
}

const author = (name: string | null | undefined, siteUrl: string, locale: Locale) =>
  compact({ '@type': 'Person', name: name ?? undefined, url: `${siteUrl}/${locale}` })

export function personJsonLd({
  email,
  jobTitle,
  locale,
  name,
  photoUrl,
  sameAs,
  siteUrl,
}: {
  email?: string | null
  jobTitle?: string | null
  locale: Locale
  name?: string | null
  photoUrl?: string | null
  sameAs?: string[]
  siteUrl: string
}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    email: email ?? undefined,
    image: absoluteUrl(photoUrl, siteUrl),
    jobTitle: jobTitle ?? undefined,
    name: name ?? undefined,
    sameAs,
    url: `${siteUrl}/${locale}`,
  })
}

export function websiteJsonLd({
  locale,
  name,
  siteUrl,
}: {
  locale: Locale
  name?: string | null
  siteUrl: string
}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    inLanguage: locale,
    name: name ?? undefined,
    url: `${siteUrl}/${locale}`,
  })
}

export function projectJsonLd({
  authorName,
  description,
  imageUrl,
  locale,
  siteUrl,
  slug,
  technologies,
  title,
  year,
}: {
  authorName?: string | null
  description?: string | null
  imageUrl?: string | null
  locale: Locale
  siteUrl: string
  slug: string
  technologies?: string[]
  title: string
  year?: number | null
}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    author: author(authorName, siteUrl, locale),
    dateCreated: year ? String(year) : undefined,
    description: description || undefined,
    image: absoluteUrl(imageUrl, siteUrl),
    inLanguage: locale,
    keywords: technologies?.length ? technologies.join(', ') : undefined,
    name: title,
    url: `${siteUrl}/${locale}/projects/${slug}`,
  })
}

export function journalJsonLd({
  authorName,
  date,
  description,
  imageUrl,
  locale,
  siteUrl,
  slug,
  title,
  updatedAt,
}: {
  authorName?: string | null
  date?: string | null
  description?: string | null
  imageUrl?: string | null
  locale: Locale
  siteUrl: string
  slug: string
  title: string
  updatedAt?: string | null
}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    author: author(authorName, siteUrl, locale),
    dateModified: updatedAt ?? undefined,
    datePublished: date ?? undefined,
    description: description || undefined,
    headline: title,
    image: absoluteUrl(imageUrl, siteUrl),
    inLanguage: locale,
    url: `${siteUrl}/${locale}/journal/${slug}`,
  })
}
