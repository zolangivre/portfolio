'use client'

import { useEffect, useRef } from 'react'

import { useSectionCrossfade } from './useSectionCrossfade'

/**
 * "Lueurs colorées": two blurred blobs that light the top of the page and
 * recede as it scrolls (scroll-driven, styles.css), a quiet mesh beneath,
 * and a tint per section — each section's colour (--tint-<id>) cross-fades
 * in as it reaches the middle of the screen. No tint over the hero.
 */
export function GradientBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Pointer parallax on the blobs — mouse and trackpad only.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const container = containerRef.current

    if (prefersReducedMotion || !hasFinePointer || !container) {
      return
    }

    let frame = 0

    function handlePointerMove(event: PointerEvent) {
      if (frame !== 0) {
        return
      }

      frame = requestAnimationFrame(() => {
        frame = 0
        const x = (event.clientX / window.innerWidth) * 2 - 1
        const y = (event.clientY / window.innerHeight) * 2 - 1
        container!.style.setProperty('--pointer-x', x.toFixed(3))
        container!.style.setProperty('--pointer-y', y.toFixed(3))
      })
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  useSectionCrossfade(containerRef, '.ambient-tint', (layer, section) => {
    if (!section) {
      return false
    }

    layer.style.setProperty('--tint', `var(--tint-${section}, transparent)`)

    return true
  })

  return (
    <div
      aria-hidden="true"
      className="ambient-background"
      data-variant="gradient"
      ref={containerRef}
    >
      <div className="ambient-mesh" />
      <div className="ambient-tint" data-on="false" />
      <div className="ambient-tint" data-on="false" />
      <div className="ambient-parallax ambient-parallax-a">
        <div className="ambient-blob ambient-blob-a" />
      </div>
      <div className="ambient-parallax ambient-parallax-b">
        <div className="ambient-blob ambient-blob-b" />
      </div>
      <div className="ambient-grain" />
    </div>
  )
}
