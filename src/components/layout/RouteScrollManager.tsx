'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { consumePendingScrollHash } from '@/lib/pendingScrollHash'

// Section content can still be streaming in behind the destination route's
// loading.tsx when this runs, same reasoning as NavScrollSpy's retry.
const MAX_ATTEMPTS = 20
const RETRY_DELAY = 150

/**
 * next/link only scrolls to top when the destination page's first element
 * isn't already inside the current viewport — otherwise it preserves
 * scroll position, like browser back/forward (see next/link docs, "scroll"
 * prop). That reads as "the new page opened scrolled down" when navigating
 * from deep in a long page (e.g. a project card near the bottom of the
 * home page) to a shorter one, so on a real route change we scroll to top
 * ourselves by default.
 *
 * The exception is a cross-page hash link (e.g. from /journal, clicking a
 * nav item back to /#projects): HashScrollHandler records that intent at
 * click time, before navigation starts, and this consumes it here — reading
 * `window.location.hash` directly on mount instead would race against
 * exactly when Next's router applies the hash portion of the URL, which
 * isn't guaranteed to happen before this effect runs.
 */
export function RouteScrollManager() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }

    const hash = consumePendingScrollHash()

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

      return
    }

    let attempt = 0
    let timeout = 0

    function tryScroll() {
      const section = document.getElementById(hash!.slice(1))

      if (section) {
        section.scrollIntoView({ behavior: 'instant', block: 'start' })

        return
      }

      if (attempt >= MAX_ATTEMPTS) {
        return
      }

      attempt += 1
      timeout = window.setTimeout(tryScroll, RETRY_DELAY)
    }

    tryScroll()

    return () => {
      if (timeout) {
        window.clearTimeout(timeout)
      }
    }
  }, [pathname])

  return null
}
