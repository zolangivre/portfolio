/**
 * TS mirror of the easing/duration custom properties defined in
 * src/app/globals.css, for use in `motion` component props (which can't
 * read CSS custom properties directly). Keep both in sync.
 */

export const EASE_OUT_PREMIUM = [0.22, 1, 0.36, 1] as const
export const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as const
export const EASE_IN_OUT_PREMIUM = [0.65, 0, 0.35, 1] as const

export const DURATION_FAST = 0.2
export const DURATION_UI = 0.25
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

/*
 * Springs in Apple's two designer parameters rather than mass/stiffness:
 * damping ratio (overshoot) maps to `bounce = 1 − ratio`, response (how fast
 * it gets there) to `visualDuration`. Critically damped is the default;
 * bounce only where a flick handed the spring real momentum.
 */

/** Reposition with no overshoot — taps, toggles, anything without a throw. */
export const springMove = {
  type: 'spring',
  bounce: 0,
  visualDuration: 0.4,
} as const

/**
 * The selection pill of a segmented control (filters, theme) gliding to the
 * option just picked. A touch of bounce — not momentum, but these are the
 * site's playful chips, and the overshoot reads as the pill settling in.
 */
export const springPlayful = {
  type: 'spring',
  bounce: 0.2,
  visualDuration: 0.35,
} as const

/** Drawers and sheets released from a drag (Apple ships ratio 0.8, response 0.3). */
export const springDrawer = {
  type: 'spring',
  bounce: 0.2,
  visualDuration: 0.3,
} as const

/**
 * Where a release at `velocity` (units/s) would coast to under scroll-like
 * deceleration — Apple's projection from *Designing Fluid Interfaces*. Add
 * it to the current position and snap to the target nearest the result.
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/** Progressive resistance past a bound: the further out, the less it follows. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

export const revealTransition = {
  duration: DURATION_SLOW,
  ease: EASE_OUT_PREMIUM,
} as const

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  visible: {
    transition: { staggerChildren, delayChildren },
  },
})
