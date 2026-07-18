'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/* Fraction of the viewport height used as the reference line: the active
   section is the last one whose top has crossed it. Sitting slightly above
   the middle feels right — a section becomes "current" as soon as it
   occupies most of the screen, not only once it hits the very top. */
const ACTIVE_LINE = 0.35

type SpyEntry = {
  link: HTMLAnchorElement
  section: HTMLElement
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

    const entries = hashLinks
      .map((link): SpyEntry | null => {
        const hash = new URL(link.href, window.location.href).hash
        const section = document.getElementById(hash.slice(1))

        return section ? { link, section } : null
      })
      .filter((entry): entry is SpyEntry => entry !== null)
      // Nav order is CMS-authored and may differ from the page's section
      // order; the "last section past the line" walk needs document order.
      .sort((a, b) =>
        a.section.compareDocumentPosition(b.section) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      )

    const clear = () => {
      for (const link of hashLinks) {
        link.removeAttribute('aria-current')
      }
    }

    if (entries.length === 0) {
      clear()

      return
    }

    let frame = 0

    const update = () => {
      frame = 0

      const line = window.innerHeight * ACTIVE_LINE
      let active: HTMLAnchorElement | null = null

      for (const { link, section } of entries) {
        if (!section.isConnected) {
          continue
        }

        if (section.getBoundingClientRect().top <= line) {
          active = link
        }
      }

      // At the very bottom of the page the last section may be too short to
      // ever cross the line — force it active so the nav doesn't lag behind.
      const scrollBottom = window.innerHeight + window.scrollY
      const lastEntry = entries[entries.length - 1]

      if (
        lastEntry.section.isConnected &&
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

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)

      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }

      clear()
    }
  }, [pathname])

  return null
}
