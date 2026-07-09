import type { Locale } from './locale'

/**
 * Resolves a CMS-authored nav/footer href into a route-safe href.
 *
 * Section anchors (e.g. "#contact") only exist on the homepage. A plain
 * `<a href="#contact">` just appends the hash to whatever route is
 * currently active (e.g. `/fr/journal#contact`), which never scrolls
 * anywhere useful. Prefixing the hash with the current locale's homepage
 * path makes it work from any route: Next.js's <Link> navigates to the
 * homepage first (if not already there) and then scrolls to the target
 * element once it exists in the DOM.
 *
 * Absolute paths and external URLs are left untouched.
 */
export function resolveNavHref(locale: Locale, href: string): string {
  if (href.startsWith('#')) {
    return `/${locale}${href}`
  }

  return href
}

/**
 * Keys of `sections-visibility` that a nav href can map to. Kept in sync
 * with the section ids rendered on the homepage.
 */
export const SECTION_KEYS = [
  'hero',
  'about',
  'projects',
  'experience',
  'education',
  'skills',
  'testimonials',
  'contact',
  'journal',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

/**
 * Maps a CMS-authored href (e.g. "#projects") to a known section key, or
 * `null` if it doesn't match one (external links, arbitrary paths). Hrefs
 * that don't map to a known section are always shown — visibility only
 * hides links we can confidently tie to a toggle.
 */
export function extractSectionKey(href: string): SectionKey | null {
  if (!href.startsWith('#')) {
    return null
  }

  const key = href.slice(1).toLowerCase()

  return (SECTION_KEYS as readonly string[]).includes(key) ? (key as SectionKey) : null
}
