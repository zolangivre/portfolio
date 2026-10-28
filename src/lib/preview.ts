import { draftMode, headers } from 'next/headers'
import { cache } from 'react'

import { locales } from './locale'

/**
 * Live Preview: the admin shows the site in an iframe, through
 * `/api/preview`, which turns on Next's Draft Mode for the editor. In Draft
 * Mode the queries read drafts, and Next bypasses `unstable_cache` and the
 * ISR cache on its own.
 */

/** Collections whose documents have their own page on the site. */
const PAGE_PATHS: Record<string, string> = {
  journal: 'journal',
  projects: 'projects',
}

/**
 * The page that shows a document: its own page for a project or a journal
 * entry, the homepage for everything else (globals, timeline entries,
 * testimonials, skills…) and for a document that has no slug yet.
 */
export function previewPath({
  collection,
  data,
  locale,
}: {
  collection?: string
  global?: string
  data: Record<string, unknown>
  locale: string
}): string {
  const segment = collection ? PAGE_PATHS[collection] : undefined
  const slug = typeof data.slug === 'string' ? data.slug : ''

  return segment && slug ? `/${locale}/${segment}/${encodeURIComponent(slug)}` : `/${locale}`
}

/**
 * The preview URL, absolute and on the admin's own origin: Payload only
 * accepts the iframe's messages when the URL starts with their origin, and
 * the preview route needs the editor's session cookie, which lives on that
 * domain. NEXT_PUBLIC_SITE_URL would point a staging admin at production.
 */
export function previewURL({ headers, path }: { headers: Headers; path: string }): string {
  // Trusting the forwarded headers is fine here: they come from the editor's
  // own admin request and only set where their iframe points. Behind several
  // proxies they hold a list: the first entry is the client's. A value that
  // isn't a plain host is skipped rather than smuggle a path or userinfo in.
  const first = (name: string) => headers.get(name)?.split(',')[0]?.trim()
  const host =
    [first('x-forwarded-host'), headers.get('host')].find(
      (candidate): candidate is string => !!candidate && /^[a-z0-9.-]+(:\d+)?$/i.test(candidate),
    ) ?? 'localhost:3000'
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  const forwardedProto = first('x-forwarded-proto')
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : isLocal
        ? 'http'
        : 'https'

  return `${proto}://${host}/api/preview?path=${encodeURIComponent(path)}`
}

const SAFE_PATH = new RegExp(`^/(${locales.join('|')})(/[^/\\\\][^\\\\]*)?$`)

/**
 * Whether `path` may be redirected to: one of the site's own localized pages.
 * Anything else (another origin, `//host`, the admin) is refused, so the
 * preview routes can't serve as an open redirect.
 */
export function isSafePreviewPath(path: unknown): path is string {
  // Printable ASCII only: it ends up in a Location header, which can't carry
  // anything else (the browser sends paths percent-encoded anyway).
  return typeof path === 'string' && /^[\x21-\x7e]+$/.test(path) && SAFE_PATH.test(path)
}

/**
 * Whether this request renders drafts: Draft Mode is on and an editor is
 * logged in. The Draft Mode cookie outlives the admin session (an editor who
 * logs out without leaving the preview), so the session is checked again on
 * every such request — once, React's `cache` sharing it between the queries.
 * Outside a request (static generation, generateStaticParams, the sitemap)
 * `draftMode()` throws: that is never a preview.
 */
export const isPreview = cache(async (): Promise<boolean> => {
  try {
    if (!(await draftMode()).isEnabled) return false

    // Imported here: payload.config.ts imports this file for the preview URL,
    // and lib/payload imports the config.
    const [{ getPayloadClient }, requestHeaders] = await Promise.all([
      import('./payload'),
      headers(),
    ])
    const { user } = await (await getPayloadClient()).auth({ headers: requestHeaders })

    return Boolean(user)
  } catch {
    return false
  }
})
