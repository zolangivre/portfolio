'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, label, [data-cursor="pointer"]'

// Convergence speed for the ring's trailing motion, in 1/ms. Applied as
// `1 - exp(-RING_SPEED * dt)` so the easing feels the same regardless of the
// display's refresh rate (a fixed per-frame factor reaches the target ~2x
// faster on a 120Hz screen than on 60Hz).
const RING_SPEED = 0.022
const STRETCH_SPEED = 0.03
const SETTLE_EPSILON = 0.05

// How strongly the ring is pulled toward a hovered interactive element's
// center, and how far that pull is allowed to displace it from the actual
// pointer position — a gentle "magnetic" bias, not a teleport to center.
const MAGNET_STRENGTH = 0.35
const MAGNET_MAX_PULL = 10

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
    let stretch = 1
    let angle = 0
    let visible = false
    let frame = 0
    let lastTime = 0
    let hoverTarget: Element | null = null
    // The magnet aims at the hovered element's centre. Reading that rect
    // inside the loop meant a forced style recalculation + layout on every
    // single frame the pointer sat on a link, button, input or card — which,
    // given INTERACTIVE_SELECTOR, is most of this site. It's cached on
    // pointerover instead and refreshed only when the geometry can actually
    // have moved (scroll, resize). The loop below now only reads numbers.
    let hoverRect: { centerX: number; centerY: number } | null = null
    let rectFrame = 0

    // The loop only runs while the ring is still catching up to the pointer;
    // it is idle (no rAF scheduled) the rest of the time, so a stationary
    // cursor costs zero main-thread work instead of a style write every frame.
    function render(time: number) {
      const dt = lastTime ? time - lastTime : 16
      lastTime = time

      let aimX = pointerX
      let aimY = pointerY

      if (hoverRect) {
        aimX += Math.max(
          -MAGNET_MAX_PULL,
          Math.min(MAGNET_MAX_PULL, (hoverRect.centerX - pointerX) * MAGNET_STRENGTH),
        )
        aimY += Math.max(
          -MAGNET_MAX_PULL,
          Math.min(MAGNET_MAX_PULL, (hoverRect.centerY - pointerY) * MAGNET_STRENGTH),
        )
      }

      const ease = 1 - Math.exp(-RING_SPEED * dt)
      const prevRingX = ringX
      const prevRingY = ringY
      ringX += (aimX - ringX) * ease
      ringY += (aimY - ringY) * ease

      // Speed-based stretch: fast moves elongate the ring slightly along its
      // direction of travel, then relax back to a circle once it settles.
      const speed = Math.hypot(ringX - prevRingX, ringY - prevRingY) / (dt || 16)
      const targetStretch = Math.min(1.15, 1 + speed * 0.12)
      stretch += (targetStretch - stretch) * (1 - Math.exp(-STRETCH_SPEED * dt))

      if (speed > 0.02) {
        angle = Math.atan2(ringY - prevRingY, ringX - prevRingX) * (180 / Math.PI)
      }

      dot!.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
      ring!.style.transform =
        `translate3d(${ringX}px, ${ringY}px, 0) rotate(${angle.toFixed(1)}deg) ` +
        `scaleX(${stretch.toFixed(3)}) scaleY(${(1 / Math.sqrt(stretch)).toFixed(3)})`

      const settled =
        Math.abs(aimX - ringX) < SETTLE_EPSILON &&
        Math.abs(aimY - ringY) < SETTLE_EPSILON &&
        Math.abs(stretch - 1) < 0.01

      if (settled) {
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

    // The one place that touches layout. Called on pointerover, and at most
    // once per frame while scrolling/resizing with something hovered.
    function measureHoverTarget() {
      if (!hoverTarget) {
        hoverRect = null

        return
      }

      const rect = hoverTarget.getBoundingClientRect()
      hoverRect = {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      }
    }

    function requestMeasure() {
      if (hoverTarget === null || rectFrame !== 0) {
        return
      }

      rectFrame = requestAnimationFrame(() => {
        rectFrame = 0
        measureHoverTarget()
        requestRender()
      })
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
      if (target instanceof Element) {
        const interactive = target.closest(INTERACTIVE_SELECTOR)
        if (interactive) {
          hoverTarget = interactive
          measureHoverTarget()
          ring!.classList.add('is-hovering')
          dot!.classList.add('is-hovering')

          const scaleAttr = (interactive as HTMLElement).dataset.cursorScale
          if (scaleAttr) {
            ring!.style.setProperty('--cursor-hover-scale', scaleAttr)
          } else {
            ring!.style.removeProperty('--cursor-hover-scale')
          }

          requestRender()
        }
      }
    }

    function handlePointerOut(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        hoverTarget = null
        hoverRect = null
        ring!.classList.remove('is-hovering')
        dot!.classList.remove('is-hovering')
        ring!.style.removeProperty('--cursor-hover-scale')
        requestRender()
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
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure, { passive: true })
    document.addEventListener('mouseout', handleLeaveWindow)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      if (rectFrame !== 0) {
        cancelAnimationFrame(rectFrame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)
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
