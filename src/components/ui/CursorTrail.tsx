'use client'

import { useEffect, useRef } from 'react'

const TRAIL_LENGTH = 14
const HEAD_SIZE = 10
const TAIL_SIZE = 3

// Convergence speed in 1/ms, same idea as CustomCursor: normalizing by the
// real frame delta keeps the trail's feel consistent across refresh rates
// instead of chasing the pointer faster on high-Hz displays.
const NODE_SPEED = 0.05
const SETTLE_EPSILON = 0.05

export function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (prefersReducedMotion || !hasFinePointer) {
      return
    }

    const container = containerRef.current

    if (!container) {
      return
    }

    document.documentElement.classList.add('has-custom-cursor')

    const nodes = Array.from(container.children) as HTMLElement[]
    const points = nodes.map(() => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }))

    let pointerX = points[0].x
    let pointerY = points[0].y
    let frame = 0
    let lastTime = 0

    // Idle (no rAF scheduled) whenever every node has caught up to the
    // pointer, so a stationary cursor costs no main-thread work.
    function render(time: number) {
      const dt = lastTime ? time - lastTime : 16
      lastTime = time

      const ease = 1 - Math.exp(-NODE_SPEED * dt)
      let targetX = pointerX
      let targetY = pointerY
      let settled = true

      points.forEach((point, index) => {
        point.x += (targetX - point.x) * ease
        point.y += (targetY - point.y) * ease
        nodes[index].style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`

        if (
          Math.abs(targetX - point.x) >= SETTLE_EPSILON ||
          Math.abs(targetY - point.y) >= SETTLE_EPSILON
        ) {
          settled = false
        }

        targetX = point.x
        targetY = point.y
      })

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

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY
      container!.classList.add('is-visible')
      requestRender()
    }

    function handleLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) {
        container!.classList.remove('is-visible')
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('mouseout', handleLeaveWindow)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('mouseout', handleLeaveWindow)
    }
  }, [])

  return (
    <div aria-hidden="true" className="cursor-trail" ref={containerRef}>
      {Array.from({ length: TRAIL_LENGTH }, (_, index) => {
        const size = HEAD_SIZE - ((HEAD_SIZE - TAIL_SIZE) * index) / (TRAIL_LENGTH - 1)

        return (
          <div
            className="cursor-trail-dot"
            key={index}
            style={{
              height: size,
              margin: `${-size / 2}px 0 0 ${-size / 2}px`,
              opacity: 1 - index / TRAIL_LENGTH,
              width: size,
            }}
          />
        )
      })}
    </div>
  )
}
