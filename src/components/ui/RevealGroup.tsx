'use client'

import { motion } from 'motion/react'
import { Children, type ReactNode } from 'react'

import { EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

type RevealGroupProps = {
  /** Fraction of a card that must be visible before it reveals (0–1). */
  amount?: number
  children: ReactNode
  className?: string
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
  once = true,
  scale,
  staggerChildren = 0.08,
  staggerCap = 4,
  y = 18,
}: RevealGroupProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y, scale }}
          transition={{
            delay: Math.min(index, staggerCap) * staggerChildren,
            duration: 0.6,
            ease: EASE_OUT_PREMIUM,
          }}
          viewport={{ amount, once }}
          whileInView={{ opacity: 1, y: 0, scale: scale !== undefined ? 1 : undefined }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
