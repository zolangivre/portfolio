'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

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
 *
 * A layout effect, so the scroll lands before the new page is painted — and
 * before a view transition snapshots it: a card's device morphing back from
 * its project page has to fly to where the card actually ends up. It's
 * applied once more on the next frame, because next/link runs its own
 * scroll-into-view after this and can nudge the page off by a few dozen
 * pixels.
 *
 * Browser back/forward returns to where the visitor was on that page — each
 * page's last scroll position is remembered here — rather than to the top.
 */
export function RouteScrollManager() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)
  const fromHistory = useRef(false)
  const currentPath = useRef(pathname)
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    let frame = 0

    const onPopState = () => {
      fromHistory.current = true
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        positions.current.set(currentPath.current, window.scrollY)
      })
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useLayoutEffect(() => {
    currentPath.current = pathname

    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }

    const hash = consumePendingScrollHash()
    const restored = fromHistory.current ? positions.current.get(pathname) : undefined
    const fromHistoryNav = fromHistory.current

    fromHistory.current = false

    // Whether the page is where it should be; false while a hash target
    // hasn't rendered yet.
    function place() {
      if (fromHistoryNav) {
        if (restored !== undefined) {
          window.scrollTo({ top: restored, left: 0, behavior: 'instant' })
        }

        return true
      }

      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

        return true
      }

      const target = document.getElementById(hash.slice(1))

      target?.scrollIntoView({ behavior: 'instant', block: 'start' })

      return Boolean(target)
    }

    let attempt = 0
    let timeout = 0

    function retry() {
      if (place() || attempt >= MAX_ATTEMPTS) {
        return
      }

      attempt += 1
      timeout = window.setTimeout(retry, RETRY_DELAY)
    }

    place()
    const frame = requestAnimationFrame(retry)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [pathname])

  return null
}
