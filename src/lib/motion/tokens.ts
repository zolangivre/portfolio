/**
 * TS mirror of the easing/duration custom properties defined in
 * src/app/globals.css, for use in `motion` component props (which can't
 * read CSS custom properties directly). Keep both in sync.
 */

export const EASE_OUT_PREMIUM = [0.22, 1, 0.36, 1] as const
export const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as const
export const EASE_IN_OUT_PREMIUM = [0.65, 0, 0.35, 1] as const

export const DURATION_FAST = 0.2
export const DURATION_BASE = 0.4
export const DURATION_SLOW = 0.7

/** Snappy spring for interactive/hover states — feels alive, not mechanical. */
export const springSnappy = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.9,
} as const

/** Gentle spring for larger entrance movements. */
export const springGentle = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
  mass: 1,
} as const

export const revealTransition = {
  duration: DURATION_SLOW,
  ease: EASE_OUT_PREMIUM,
} as const

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  visible: {
    transition: { staggerChildren, delayChildren },
  },
})
