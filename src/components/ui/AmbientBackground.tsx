'use client'

import { useEffect, useRef } from 'react'

export function AmbientBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (prefersReducedMotion || !hasFinePointer) {
      return
    }

    let frame = 0

    function handlePointerMove(event: PointerEvent) {
      if (frame) {
        return
      }

      frame = requestAnimationFrame(() => {
        frame = 0
        spotlightRef.current?.style.setProperty('--spot-x', `${event.clientX}px`)
        spotlightRef.current?.style.setProperty('--spot-y', `${event.clientY}px`)
      })
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <div aria-hidden="true" className="ambient-background">
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      <div className="ambient-grain" />
      <div className="ambient-spotlight" ref={spotlightRef} />
    </div>
  )
}
