'use client'

import { useEffect, useRef } from 'react'

/**
 * Attaches a subtle "magnetic" pull to the returned ref's element: it eases
 * toward the pointer while hovered (capped, lerped back to rest on leave).
 * Bails out entirely for touch devices and prefers-reduced-motion, matching
 * the guard already used by AmbientBackground/CustomCursor.
 */
export function useMagneticHover<T extends HTMLElement>(strength = 0.35, maxOffset = 14) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (prefersReducedMotion || !hasFinePointer) {
      return
    }

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frame = 0

    function tick() {
      currentX += (targetX - currentX) * 0.2
      currentY += (targetY - currentY) * 0.2
      el!.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const relX = event.clientX - (rect.left + rect.width / 2)
      const relY = event.clientY - (rect.top + rect.height / 2)

      targetX = Math.max(-maxOffset, Math.min(maxOffset, relX * strength))
      targetY = Math.max(-maxOffset, Math.min(maxOffset, relY * strength))

      if (frame === 0) {
        frame = requestAnimationFrame(tick)
      }
    }

    function handlePointerLeave() {
      targetX = 0
      targetY = 0

      if (frame === 0) {
        frame = requestAnimationFrame(tick)
      }
    }

    el.style.willChange = 'transform'
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerleave', handlePointerLeave)

      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }

      el.style.transform = ''
      el.style.willChange = ''
    }
  }, [strength, maxOffset])

  return ref
}
