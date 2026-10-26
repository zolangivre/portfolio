'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** More cards than this, and the dots give way to a "3 / 24" counter. */
const MAX_DOTS = 10

type ShelfProps = {
  /** The `.shelf` row — a grid that becomes a swipeable row on phones. */
  children: ReactNode
  /** On the wrapper — e.g. to size it as a flex item next to something else. */
  className?: string
  navLabel: string
  /** One per card, in order: what each dot is announced as. */
  titles: string[]
}

/**
 * On phones a grid of parallel items — projects, skill categories, the
 * About cards — turns into a row you swipe through, like an App Store shelf
 * (styles.css, .shelf). Only for collections you browse: a chronology or a
 * text you read stays vertical. The swipe itself is native
 * scrolling with scroll-snap — the platform's own momentum, rubber-banding
 * at the ends and settling on a card, which nothing hand-rolled matches on
 * iOS. This adds the page dots under it: where you are in the row, and a
 * way to jump. Hidden from 720px, where the grid is a grid again.
 */
export function Shelf({ children, className, navLabel, titles }: ShelfProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const scroller = () => rootRef.current?.querySelector<HTMLElement>('.shelf') ?? null

  useEffect(() => {
    const row = rootRef.current?.querySelector<HTMLElement>('.shelf')

    if (!row) {
      return
    }

    let frame = 0
    // Fixed by the stylesheet, so read once rather than on every frame.
    const snapPadding = parseFloat(getComputedStyle(row).scrollPaddingInlineStart || '0')

    // The card whose leading edge sits closest to where cards snap to.
    const update = () => {
      frame = 0
      const snapLine = row.getBoundingClientRect().left + snapPadding
      let nearest = 0
      let distance = Infinity

      Array.from(row.children).forEach((child, index) => {
        const gap = Math.abs(child.getBoundingClientRect().left - snapLine)

        if (gap < distance) {
          distance = gap
          nearest = index
        }
      })

      // The last card can't reach the snap line — the row runs out first —
      // so the end of the row counts as being on it.
      const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2

      setActive(atEnd ? row.children.length - 1 : nearest)
    }

    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update)
      }
    }

    row.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      row.removeEventListener('scroll', onScroll)
    }
  }, [])

  function goTo(index: number) {
    const card = scroller()?.children[index]
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    card?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  return (
    <div className={className} ref={rootRef}>
      {children}
      {titles.length > MAX_DOTS ? (
        // Past a dozen, dots stop fitting a phone's width (and stop being
        // countable): where you are, as a number, in the same slot.
        <p aria-hidden="true" className="shelf-dots shelf-counter">
          {active + 1} / {titles.length}
        </p>
      ) : titles.length > 1 ? (
        <div aria-label={navLabel} className="shelf-dots" role="group">
          {titles.map((title, index) => (
            <button
              aria-current={index === active ? 'true' : undefined}
              aria-label={title}
              className="shelf-dot"
              data-active={index === active}
              key={`${title}-${index}`}
              onClick={() => goTo(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
