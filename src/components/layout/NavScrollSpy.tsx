'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/* Fraction of the viewport height used as the reference line: the active
   section is the last one whose top has crossed it. Sitting slightly above
   the middle feels right — a section becomes "current" as soon as it
   occupies most of the screen, not only once it hits the very top. */
const ACTIVE_LINE = 0.35

// Header (and this component) live in layout.tsx, outside the per-route
// Suspense boundary that loading.tsx creates around page.tsx. On a slow
// render the nav can mount before the section elements it points to have
// streamed in, so the first lookup legitimately finds nothing yet — retry
// for a few seconds before concluding the sections really don't exist here
// (e.g. on a page that has none, like a project detail page).
const MAX_ATTEMPTS = 20
const RETRY_DELAY = 150

type SpyEntry = {
  link: HTMLAnchorElement
  id: string
}

/**
 * Highlights the nav link matching the section currently in view.
 *
 * Runs against the DOM rather than React state because the nav links are
 * server-rendered by Header. Sets `aria-current="location"` on the active
 * link; styling hangs off that attribute in CSS so the highlight stays
 * accessible for free.
 */
export function NavScrollSpy() {
  const pathname = usePathname()

  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.site-nav a'))

    // Links to standalone pages (e.g. the journal) are highlighted by route,
    // not by scroll position; sub-routes like /fr/journal/[slug] count too.
    for (const link of links) {
      const url = new URL(link.href, window.location.href)

      if (url.hash || url.origin !== window.location.origin) {
        continue
      }

      const linkPath = url.pathname.replace(/\/$/, '')
      const isActive =
        linkPath !== '' && (pathname === linkPath || pathname.startsWith(`${linkPath}/`))

      if (isActive) {
        link.setAttribute('aria-current', 'page')
      } else {
        link.removeAttribute('aria-current')
      }
    }

    const hashLinks = links.filter((link) => new URL(link.href, window.location.href).hash !== '')

    // Resolves the section by id on every call rather than caching the
    // element: Next.js can silently swap in a fresh render of the same route
    // (router cache revalidation) without this component's pathname ever
    // changing, which replaces the section nodes already on the page. A
    // cached reference would go stale and permanently disconnected, leaving
    // the nav stuck with no active link until a hard refresh.
    function buildEntries(): SpyEntry[] {
      return hashLinks
        .map((link): SpyEntry | null => {
          const hash = new URL(link.href, window.location.href).hash
          const id = hash.slice(1)

          return document.getElementById(id) ? { link, id } : null
        })
        .filter((entry): entry is SpyEntry => entry !== null)
        // Nav order is CMS-authored and may differ from the page's section
        // order; the "last section past the line" walk needs document order.
        .sort((a, b) => {
          const sectionA = document.getElementById(a.id)
          const sectionB = document.getElementById(b.id)

          if (!sectionA || !sectionB) {
            return 0
          }

          return sectionA.compareDocumentPosition(sectionB) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1
        })
    }

    function clear() {
      for (const link of hashLinks) {
        link.removeAttribute('aria-current')
      }
    }

    let retryTimeout = 0
    let detach: (() => void) | null = null

    function attach(entries: SpyEntry[]) {
      let frame = 0

      function update() {
        frame = 0

        const line = window.innerHeight * ACTIVE_LINE
        let active: HTMLAnchorElement | null = null

        for (const { link, id } of entries) {
          const section = document.getElementById(id)

          if (section && section.getBoundingClientRect().top <= line) {
            active = link
          }
        }

        // At the very bottom of the page the last section may be too short to
        // ever cross the line — force it active so the nav doesn't lag behind.
        // Guarded to scrollY > 0: right after the content behind loading.tsx
        // streams in, a layout pass can briefly report a shorter
        // scrollHeight than the final page, which would otherwise satisfy
        // this check at the very top of the page and wrongly highlight the
        // last section (e.g. Contact) before the user has scrolled at all.
        const scrollBottom = window.innerHeight + window.scrollY
        const lastEntry = entries[entries.length - 1]
        const lastSection = document.getElementById(lastEntry.id)

        if (
          window.scrollY > 0 &&
          lastSection &&
          scrollBottom >= document.documentElement.scrollHeight - 2
        ) {
          active = lastEntry.link
        }

        for (const { link } of entries) {
          if (link === active) {
            link.setAttribute('aria-current', 'location')
          } else {
            link.removeAttribute('aria-current')
          }
        }
      }

      function requestUpdate() {
        if (frame === 0) {
          frame = window.requestAnimationFrame(update)
        }
      }

      update()
      window.addEventListener('scroll', requestUpdate, { passive: true })
      window.addEventListener('resize', requestUpdate)

      detach = () => {
        window.removeEventListener('scroll', requestUpdate)
        window.removeEventListener('resize', requestUpdate)

        if (frame !== 0) {
          window.cancelAnimationFrame(frame)
        }

        clear()
      }
    }

    function tryStart(attempt: number) {
      const entries = buildEntries()

      if (entries.length > 0) {
        attach(entries)

        return
      }

      if (hashLinks.length === 0 || attempt >= MAX_ATTEMPTS) {
        clear()

        return
      }

      retryTimeout = window.setTimeout(() => tryStart(attempt + 1), RETRY_DELAY)
    }

    tryStart(0)

    return () => {
      if (retryTimeout) {
        window.clearTimeout(retryTimeout)
      }

      detach?.()
    }
  }, [pathname])

  return null
}
