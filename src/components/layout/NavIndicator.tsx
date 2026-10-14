'use client'

import { animate, motion, useMotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'

import { springPlayful } from '@/lib/motion/tokens'

/**
 * The underline under the current header link, as one object that glides
 * from link to link as you scroll from section to section — the way the
 * journal filters and the theme switch move their pill — instead of one
 * line vanishing while another appears.
 *
 * Follows `aria-current`, which NavScrollSpy sets on the links; it never
 * decides on its own what's current. Desktop header only: in the phone
 * drawer the links are stacked and keep their own underline (styles.css).
 */
export function NavIndicator() {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const width = useMotionValue(0)
  const opacity = useMotionValue(0)

  useEffect(() => {
    const indicator = ref.current
    const nav = indicator?.parentElement

    if (!indicator || !nav) {
      return
    }

    const wide = window.matchMedia('(min-width: 881px)')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let shown = false

    const place = () => {
      const link = nav.querySelector<HTMLElement>('a[aria-current]')

      if (!link || !wide.matches) {
        shown = false
        animate(opacity, 0, { duration: 0.2 })

        return
      }

      const left = link.getBoundingClientRect().left - nav.getBoundingClientRect().left
      const span = link.getBoundingClientRect().width

      // Appearing, it starts under its link; only a move between links glides.
      if (!shown || reduceMotion.matches) {
        x.jump(left)
        width.jump(span)
      } else {
        animate(x, left, springPlayful)
        animate(width, span, springPlayful)
      }

      shown = true
      animate(opacity, 1, { duration: 0.2 })
    }

    const mutations = new MutationObserver(place)
    mutations.observe(nav, { attributeFilter: ['aria-current'], attributes: true, subtree: true })
    const resizes = new ResizeObserver(place)
    resizes.observe(nav)
    wide.addEventListener('change', place)
    place()

    return () => {
      mutations.disconnect()
      resizes.disconnect()
      wide.removeEventListener('change', place)
    }
  }, [opacity, width, x])

  return (
    <motion.span
      aria-hidden="true"
      className="site-nav-indicator"
      ref={ref}
      style={{ opacity, width, x }}
    />
  )
}
