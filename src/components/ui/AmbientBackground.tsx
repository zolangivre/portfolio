'use client'

import { useEffect, useRef } from 'react'

export function AmbientBackground() {
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

  return (
    <div aria-hidden="true" className="ambient-background" ref={containerRef}>
      <div className="ambient-mesh" />
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
