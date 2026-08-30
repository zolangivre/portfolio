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
    // This used to call getBoundingClientRect() inside the pointermove
    // handler, i.e. a forced layout per pointer event — and pointermove
    // fires well above the frame rate on a trackpad or a high-Hz mouse, so
    // it was several forced layouts per frame on the hero's CTAs. The
    // element's own transform never changes its layout box, so the centre
    // only has to be measured when the pointer arrives, and re-measured if
    // the page scrolls or resizes while it's still hovered.
    let centerX = 0
    let centerY = 0
    let hovered = false
    let measureFrame = 0

    function measure() {
      const rect = el!.getBoundingClientRect()
      centerX = rect.left + rect.width / 2
      centerY = rect.top + rect.height / 2
    }

    function requestMeasure() {
      if (!hovered || measureFrame !== 0) {
        return
      }

      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0
        measure()
      })
    }

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

    function handlePointerEnter() {
      hovered = true
      measure()
    }

    function handlePointerMove(event: PointerEvent) {
      // pointerenter normally runs first, so this handler is pure
      // arithmetic. The exception is a pointer already sitting on the
      // element when the effect mounts, which gets no enter event — without
      // this the first move would measure against (0, 0) and snap the
      // button straight to maxOffset.
      if (!hovered) {
        handlePointerEnter()
      }

      targetX = Math.max(-maxOffset, Math.min(maxOffset, (event.clientX - centerX) * strength))
      targetY = Math.max(-maxOffset, Math.min(maxOffset, (event.clientY - centerY) * strength))

      if (frame === 0) {
        frame = requestAnimationFrame(tick)
      }
    }

    function handlePointerLeave() {
      hovered = false
      targetX = 0
      targetY = 0

      if (frame === 0) {
        frame = requestAnimationFrame(tick)
      }
    }

    el.style.willChange = 'transform'
    el.addEventListener('pointerenter', handlePointerEnter, { passive: true })
    el.addEventListener('pointermove', handlePointerMove, { passive: true })
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure, { passive: true })

    return () => {
      el.removeEventListener('pointerenter', handlePointerEnter)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)

      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      if (measureFrame !== 0) {
        cancelAnimationFrame(measureFrame)
      }

      el.style.transform = ''
      el.style.willChange = ''
    }
  }, [strength, maxOffset])

  return ref
}
