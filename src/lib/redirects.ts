import { defaultLocale, locales, type Locale } from './locale'

/**
 * Redirects (the `redirects` collection, from Payload's redirects plugin):
 * an old URL of the site that no longer exists sends the visitor on to a
 * project, a journal entry or any other URL. Pages only look one up right
 * before answering 404, so a redirect can never hide a page that exists.
 */

/** The collections a redirect can point to, and the URL segment of each. */
export const redirectTargets = { journal: 'journal', projects: 'projects' } as const

export type RedirectTarget = keyof typeof redirectTargets

/** The site path of a project or journal entry. */
export const contentPath = (collection: RedirectTarget, slug: string, locale: Locale) =>
  `/${locale}/${redirectTargets[collection]}/${slug}`

/**
 * What an editor types in "URL d'origine", as the path the site compares:
 * a pasted full URL loses its origin, query and hash, a missing leading
 * slash is added and a trailing one dropped.
 */
export function normalizeRedirectPath(input: string): string {
  let path = input.trim()

  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname
  } catch {
    // Not a URL after all: keep it as a path.
  }

  path = path.replace(/[?#].*$/, '')
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/{2,}/g, '/')

  return path.length > 1 ? path.replace(/\/$/, '') : path
}

/** The locale a site path starts with, if any. */
export function pathLocale(path: string): Locale | undefined {
  return locales.find((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`))
}

/**
 * The `from` values that match a requested path: the path itself and, for a
 * localized path, the same path without its locale, so `/projects/old`
 * covers `/fr/projects/old` and `/en/projects/old`.
 */
export function redirectCandidates(path: string): string[] {
  const normalized = normalizeRedirectPath(path)
  const locale = pathLocale(normalized)

  if (!locale) return [normalized]

  return [normalized, normalized.slice(locale.length + 1) || '/']
}

type RedirectDoc = {
  to?: {
    reference?: {
      relationTo: string
      value: number | { _status?: string | null; slug?: string | null } | null
    } | null
    type?: 'custom' | 'reference' | null
    url?: string | null
  } | null
}

/**
 * Where a redirect sends a visitor who asked for `path`. A project or entry
 * keeps the visitor's locale, and only counts while it is published and out
 * of the trash (a trashed reference populates as null). `null` when there is
 * nowhere to go, or when the destination is the path itself.
 */
export function redirectDestination(redirect: RedirectDoc, path: string): string | null {
  const to = redirect.to
  let destination: string | null = null

  if (to?.type === 'custom' && to.url?.trim()) {
    destination = to.url.trim()
  } else if (to?.type === 'reference' && to.reference) {
    const { relationTo, value } = to.reference
    if (
      relationTo in redirectTargets &&
      value &&
      typeof value === 'object' &&
      value.slug &&
      value._status === 'published'
    ) {
      destination = contentPath(
        relationTo as RedirectTarget,
        value.slug,
        pathLocale(normalizeRedirectPath(path)) ?? defaultLocale,
      )
    }
  }

  if (!destination) return null
  if (
    destination.startsWith('/') &&
    normalizeRedirectPath(destination) === normalizeRedirectPath(path)
  ) {
    return null
  }

  return destination
}
