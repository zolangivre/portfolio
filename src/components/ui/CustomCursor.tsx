'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, label, [data-cursor="pointer"]'

// Convergence speed for the ring's trailing motion, in 1/ms. Applied as
// `1 - exp(-RING_SPEED * dt)` so the easing feels the same regardless of the
// display's refresh rate (a fixed per-frame factor reaches the target ~2x
// faster on a 120Hz screen than on 60Hz).
const RING_SPEED = 0.022
const SETTLE_EPSILON = 0.05

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (prefersReducedMotion || !hasFinePointer) {
      return
    }

    const dot = dotRef.current
    const ring = ringRef.current

    if (!dot || !ring) {
      return
    }

    document.documentElement.classList.add('has-custom-cursor')

    let pointerX = window.innerWidth / 2
    let pointerY = window.innerHeight / 2
    let ringX = pointerX
    let ringY = pointerY
    let visible = false
    let frame = 0
    let lastTime = 0

    // The loop only runs while the ring is still catching up to the pointer;
    // it is idle (no rAF scheduled) the rest of the time, so a stationary
    // cursor costs zero main-thread work instead of a style write every frame.
    function render(time: number) {
      const dt = lastTime ? time - lastTime : 16
      lastTime = time

      const ease = 1 - Math.exp(-RING_SPEED * dt)
      ringX += (pointerX - ringX) * ease
      ringY += (pointerY - ringY) * ease

      dot!.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
      ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`

      const settled =
        Math.abs(pointerX - ringX) < SETTLE_EPSILON && Math.abs(pointerY - ringY) < SETTLE_EPSILON

      if (settled) {
        ringX = pointerX
        ringY = pointerY
        ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
        frame = 0
        lastTime = 0

        return
      }

      frame = requestAnimationFrame(render)
    }

    function requestRender() {
      if (frame === 0) {
        frame = requestAnimationFrame(render)
      }
    }

    function show() {
      if (!visible) {
        visible = true
        dot!.classList.add('is-visible')
        ring!.classList.add('is-visible')
      }
    }

    function hide() {
      visible = false
      dot!.classList.remove('is-visible')
      ring!.classList.remove('is-visible')
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY
      show()
      requestRender()
    }

    function handlePointerOver(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.add('is-hovering')
        dot!.classList.add('is-hovering')
      }
    }

    function handlePointerOut(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.remove('is-hovering')
        dot!.classList.remove('is-hovering')
      }
    }

    function handlePointerDown() {
      ring!.classList.add('is-pressed')
    }

    function handlePointerUp() {
      ring!.classList.remove('is-pressed')
    }

    function handleLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) {
        hide()
      }
    }

    // Paint the initial position once without starting the loop; it starts
    // for real on the first pointermove.
    dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerover', handlePointerOver, { passive: true })
    window.addEventListener('pointerout', handlePointerOut, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    document.addEventListener('mouseout', handleLeaveWindow)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('mouseout', handleLeaveWindow)
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div className="cursor-ring" ref={ringRef} />
      <div className="cursor-dot" ref={dotRef} />
    </div>
  )
}
