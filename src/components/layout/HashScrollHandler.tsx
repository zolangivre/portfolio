'use client'

import { useEffect } from 'react'

import { setPendingScrollHash } from '@/lib/pendingScrollHash'

/**
 * next/link only scrolls to a hash target as part of deciding whether the
 * destination Page is "visible in the viewport" — for a same-page hash link
 * (nav items, a CTA like the hero's primary button) the Page never actually
 * navigates away, so that check is trivially true and the built-in scroll
 * is skipped. That reads as "the first hash link works, the next one does
 * nothing" — e.g. a plain `<a href="#contact">` jumps fine (native browser
 * behavior), but the nav's `<Link href="/fr#projects">` clicked right after
 * silently updates the URL with no scroll.
 *
 * Takes scrolling into our own hands for any link whose target resolves to
 * an element already on the current page: harmless if next/link or the
 * browser also scroll there, and the only thing that fires when they don't.
 *
 * For a hash link to a *different* page (e.g. from /journal back to
 * /#projects), the target doesn't exist yet — RouteScrollManager picks up
 * the intent recorded here once the destination page has mounted.
 */
export function HashScrollHandler() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href*="#"]')

      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      const url = new URL(anchor.href, window.location.href)

      if (!url.hash || url.origin !== window.location.origin) {
        return
      }

      if (url.pathname !== window.location.pathname) {
        setPendingScrollHash(url.hash)

        return
      }

      const section = document.getElementById(url.hash.slice(1))

      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return null
}
