'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  once?: boolean
  scale?: number
  y?: number
}

// Opacity and transform only: an animated `filter: blur()` re-rasterizes the
// whole element on every frame, and this wraps large images.
export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  scale,
  y = 18,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale }}
      transition={{ delay, duration: 0.6, ease: EASE_OUT_PREMIUM }}
      viewport={{ margin: '-80px', once }}
      whileInView={{ opacity: 1, y: 0, scale: scale !== undefined ? 1 : undefined }}
    >
      {children}
    </motion.div>
  )
}
