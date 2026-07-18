'use client'

import { useEffect, useRef } from 'react'

const TRAIL_LENGTH = 14
const HEAD_SIZE = 10
const TAIL_SIZE = 3

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

    function render() {
      let targetX = pointerX
      let targetY = pointerY

      points.forEach((point, index) => {
        point.x += (targetX - point.x) * 0.35
        point.y += (targetY - point.y) * 0.35
        nodes[index].style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
        targetX = point.x
        targetY = point.y
      })

      frame = requestAnimationFrame(render)
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY
      container!.classList.add('is-visible')
    }

    function handleLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) {
        container!.classList.remove('is-visible')
      }
    }

    frame = requestAnimationFrame(render)

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('mouseout', handleLeaveWindow)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      cancelAnimationFrame(frame)
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
