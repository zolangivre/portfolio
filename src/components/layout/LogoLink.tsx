'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'

type LogoLinkProps = {
  ariaLabel: string
  children: ReactNode
  className: string
  href: string
}

/**
 * The logo goes home — and, when you're already home, back to the top, the
 * way tapping an iPhone's status bar scrolls a page back up. Otherwise it's
 * a plain link (new tabs, modified clicks and other pages are untouched).
 */
export function LogoLink({ ariaLabel, children, className, href }: LogoLinkProps) {
  const pathname = usePathname()

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

    if (modified || event.button !== 0 || pathname !== href) {
      return
    }

    event.preventDefault()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({ behavior: reduceMotion ? 'auto' : 'smooth', top: 0 })
    // Drop a section hash (#projects…) so the address matches the place.
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', href)
    }
  }

  return (
    <Link aria-label={ariaLabel} className={className} href={href} onClick={onClick}>
      {children}
    </Link>
  )
}
