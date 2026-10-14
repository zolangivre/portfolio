'use client'

import { animate, motionValue, type MotionValue } from 'motion/react'
import { useEffect } from 'react'

import { springMove } from '@/lib/motion/tokens'

/** Furthest a card leans, in degrees, with the pointer at its edge. */
const MAX_TILT = 5

/** Tracks the pointer closely while it's over the card. */
const springFollow = { type: 'spring', bounce: 0, visualDuration: 0.18 } as const

type Tilt = { x: MotionValue<number>; y: MotionValue<number> }

/**
 * Apple TV's focus effect on every clickable card (the ones carrying a
 * `data-card-link`): the card leans toward the pointer and a soft sheen
 * follows it across the surface, as if light were catching it.
 *
 * One delegated listener for the whole page rather than a client wrapper
 * per card, so the cards themselves stay server components. Each card gets
 * two independent springs — X and Y — so a diagonal move doesn't drag one
 * axis along with the other; they write the individual `rotate` property
 * (composited, and composes with the hover lift's `transform` and the
 * press `scale`) plus two custom properties for the sheen.
 *
 * Mouse and trackpad only, never under reduced motion.
 */
export function CardTilt() {
  useEffect(() => {
    const canTilt = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    const tilts = new WeakMap<HTMLElement, Tilt>()
    let active: HTMLElement | null = null

    function tiltFor(card: HTMLElement): Tilt {
      const existing = tilts.get(card)

      if (existing) {
        return existing
      }

      const tilt = { x: motionValue(0), y: motionValue(0) }
      const render = () => {
        const x = tilt.x.get()
        const y = tilt.y.get()
        const angle = Math.hypot(x, y)

        // rotateX(x) then rotateY(y) collapses, at these small angles, to a
        // single turn of |(x, y)| around the axis (x, y, 0).
        card.style.rotate = angle < 0.01 ? '' : `${x} ${y} 0 ${angle.toFixed(2)}deg`
        // The sheen sits on the side the card leans toward.
        card.style.setProperty('--sheen-x', `${((y / MAX_TILT) * 25).toFixed(1)}%`)
        card.style.setProperty('--sheen-y', `${((-x / MAX_TILT) * 25).toFixed(1)}%`)
      }

      tilt.x.on('change', render)
      tilt.y.on('change', render)
      tilts.set(card, tilt)

      return tilt
    }

    // Back to flat on the default spring — no bounce, nothing threw it.
    function release(card: HTMLElement) {
      const tilt = tiltFor(card)

      card.removeAttribute('data-tilting')
      animate(tilt.x, 0, springMove)
      animate(tilt.y, 0, springMove)
    }

    function onPointerMove(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null
      const frame = target?.closest<HTMLElement>('.card-glow')
      const card =
        frame && canTilt.matches && event.pointerType === 'mouse'
          ? frame.querySelector<HTMLElement>(':scope > .card-lift')
          : null
      const tiltable = card?.matches('[data-card-link], :has([data-card-link])') ? card : null

      if (active && active !== tiltable) {
        release(active)
      }

      active = tiltable

      if (!tiltable) {
        return
      }

      const rect = tiltable.getBoundingClientRect()
      // -0.5 … 0.5 across the card.
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      const tilt = tiltFor(tiltable)

      tiltable.setAttribute('data-tilting', '')
      // The side under the pointer dips away from the viewer.
      animate(tilt.x, -py * 2 * MAX_TILT, springFollow)
      animate(tilt.y, px * 2 * MAX_TILT, springFollow)
    }

    function onLeaveWindow() {
      if (active) {
        release(active)
        active = null
      }
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [])

  return null
}
