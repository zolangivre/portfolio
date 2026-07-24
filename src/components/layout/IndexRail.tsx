import Link from 'next/link'

import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { extractSectionKey, resolveNavHref } from '@/lib/nav'
import type { Navigation, SectionsVisibility } from '@/payload-types'

type IndexRailProps = {
  dictionary: Dictionary
  locale: Locale
  navigation: Navigation | null
  sections: SectionsVisibility | null
}

/**
 * Desktop-only vertical rail of soft dots for the homepage's in-page
 * sections. Reuses NavScrollSpy's existing mechanism: it queries every
 * `.site-nav a` on the page and sets `aria-current` on whichever is
 * currently in view, so giving this nav the same class is enough to make
 * the rail light up in sync with the header — no separate scroll tracking
 * needed.
 */
export function IndexRail({ dictionary, locale, navigation, sections }: IndexRailProps) {
  const items = (navigation?.items ?? []).filter((item) => {
    if (!item.href.startsWith('#')) {
      return false
    }

    const key = extractSectionKey(item.href)

    return key === null || sections?.[key] !== false
  })

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label={dictionary.nav.sectionIndexLabel} className="index-rail site-nav">
      <ol>
        {items.map((item) => (
          <li key={item.id ?? item.href}>
            <Link href={resolveNavHref(locale, item.href)}>
              <span aria-hidden="true" className="index-rail-num" />
              <span className="index-rail-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
