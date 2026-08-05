/**
 * Tag-based cache invalidation.
 *
 * Every read in `src/lib/queries` is wrapped in `unstable_cache` and declares
 * the Payload slugs its result depends on. Next propagates those tags from the
 * data cache entry up to the Full Route Cache entry of whichever page read it,
 * so a single `revalidateTag(slug)` from an `afterChange` hook invalidates
 * exactly the pages that render that content — and in both locales at once,
 * since a tag is not locale-scoped.
 *
 * Tag values are the Payload collection/global slugs verbatim: the hooks in
 * `src/hooks/revalidateSite.ts` derive them from `collection.slug` /
 * `global.slug`, so the two sides can't drift.
 */
export const cacheTags = {
  about: 'about',
  categories: 'categories',
  companies: 'companies',
  contact: 'contact',
  education: 'education',
  experiences: 'experiences',
  footer: 'footer',
  hero: 'hero',
  journal: 'journal',
  media: 'media',
  navigation: 'navigation',
  projects: 'projects',
  schools: 'schools',
  sectionsContent: 'sections-content',
  sectionsVisibility: 'sections-visibility',
  settings: 'settings',
  skills: 'skills',
  technologies: 'technologies',
  testimonials: 'testimonials',
} as const

/**
 * Fallback expiry for both the data cache entries and the route segments, in
 * seconds (24h).
 *
 * Pages are refreshed by tag the moment Payload saves, so this interval never
 * carries the freshness — it only exists so a page can't stay stale forever if
 * a hook doesn't fire (content edited by a script, `payload migrate`, a hook
 * that throws). It is the single knob that decides the floor of recurring ISR
 * writes: 34 prerendered routes / 24h ≈ 1k writes per month, against the
 * ~135k the previous 60s interval was costing. Set it to `false` to drive that
 * floor to zero, at the cost of losing the safety net.
 */
export const FALLBACK_REVALIDATE = 86400
