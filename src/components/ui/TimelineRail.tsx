'use client'

import { motion } from 'motion/react'

import { EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

/**
 * The vertical connector line for `.timeline` (Experience/Education
 * sections): absolutely positioned so it doesn't participate in the layout,
 * drawing itself top-down as the section scrolls into view. Node markers per
 * row are plain CSS (`.timeline-row::before`) since they need no independent
 * animation — they fade in together with their own row.
 */
export function TimelineRail() {
  return (
    <motion.span
      aria-hidden="true"
      className="timeline-rail"
      initial={{ scaleY: 0 }}
      style={{ transformOrigin: 'top' }}
      transition={{ duration: 1.1, ease: EASE_OUT_PREMIUM }}
      viewport={{ margin: '-40px', once: true }}
      whileInView={{ scaleY: 1 }}
    />
  )
}
