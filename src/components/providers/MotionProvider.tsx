'use client'

import { MotionConfig } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  // iOS Safari only applies `:active` while some touchstart listener is
  // registered — without one, every press state in styles.css (cards,
  // buttons, filters) would show on desktop and never under a finger.
  useEffect(() => {
    const noop = () => {}

    document.addEventListener('touchstart', noop, { passive: true })

    return () => document.removeEventListener('touchstart', noop)
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
