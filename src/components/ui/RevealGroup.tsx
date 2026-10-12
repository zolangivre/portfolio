'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Children, type ReactNode } from 'react'

import { DURATION_FAST, EASE_IN_OUT_PREMIUM, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

type RevealGroupProps = {
  /** Fraction of a card that must be visible before it reveals (0–1). */
  amount?: number
  children: ReactNode
  className?: string
  /**
   * For grids whose items change at runtime (filters): remaining items slide
   * to their new slot and removed ones fade out, instead of teleporting.
   */
  layout?: boolean
  once?: boolean
  scale?: number
  staggerChildren?: number
  /** Caps how much the stagger delay can build up across many items. */
  staggerCap?: number
  y?: number
}

/**
 * Grid/list reveal where every card is its own independent intersection
 * target — each one animates only once IT crosses `amount` visible, not when
 * some ancestor container's edge does. A single container-level
 * `whileInView` (the previous design) breaks down for long grids: once the
 * container's top edge enters the viewport, framer's `staggerChildren` fires
 * the whole cascade off a timer from that moment, so cards several rows down
 * (still off-screen) finish animating long before the user actually scrolls
 * to them. Per-card observation with a real `amount` threshold (not a
 * viewport-margin heuristic) keeps the reveal tied to what's actually
 * on-screen, the way a plain IntersectionObserver would.
 */
export function RevealGroup({
  amount = 0.25,
  children,
  className,
  layout = false,
  once = true,
  scale,
  staggerChildren = 0.08,
  staggerCap = 4,
  y = 18,
}: RevealGroupProps) {
  const items = Children.map(children, (child, index) => (
    <motion.div
      exit={
        layout
          ? {
              opacity: 0,
              scale: 0.96,
              transition: { duration: DURATION_FAST, ease: EASE_OUT_PREMIUM },
            }
          : undefined
      }
      initial={{ opacity: 0, y, scale }}
      layout={layout ? 'position' : undefined}
      transition={{
        delay: Math.min(index, staggerCap) * staggerChildren,
        duration: 0.6,
        ease: EASE_OUT_PREMIUM,
        layout: { delay: 0, duration: 0.3, ease: EASE_IN_OUT_PREMIUM },
      }}
      viewport={{ amount, once }}
      whileInView={{ opacity: 1, y: 0, scale: scale !== undefined ? 1 : undefined }}
    >
      {child}
    </motion.div>
  ))

  if (!layout) {
    return <div className={className}>{items}</div>
  }

  // popLayout takes exiting items out of flow with `position: absolute`,
  // measured against this wrapper — hence `relative`.
  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <AnimatePresence mode="popLayout">{items}</AnimatePresence>
    </div>
  )
}
