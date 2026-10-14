'use client'

import { useEffect, useRef } from 'react'

type Phase = 'night' | 'dawn' | 'morning' | 'day' | 'golden' | 'dusk'

function phaseAt(hour: number): Phase {
  if (hour < 5 || hour >= 21) return 'night'
  if (hour < 8) return 'dawn'
  if (hour < 11) return 'morning'
  if (hour < 16) return 'day'
  if (hour < 19) return 'golden'
  return 'dusk'
}

/** Re-read the clock this often; the light changes slowly. */
const REFRESH_MS = 10 * 60 * 1000

/**
 * "Lumière selon l'heure": like macOS's dynamic wallpapers, the page takes
 * the light of the visitor's own time of day — a pale dawn, a clear day, a
 * golden late afternoon, a dusky evening, a starry night — with the sun (or
 * the moon) placed along its arc for the hour. Each visit at a different
 * time looks a little different, and nothing moves while you read: the
 * light only changes with the clock (checked every ten minutes, eased in),
 * and the sun sinks a little as you scroll away from the top.
 *
 * The server can't know the visitor's hour, so the sky stays hidden until
 * the browser has set it, then fades in — no flash of the wrong time.
 */
export function DaylightBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const update = () => {
      const now = new Date()
      const hour = now.getHours() + now.getMinutes() / 60
      const phase = phaseAt(hour)
      // The sun's arc runs from 6h to 20h: low at either end, high at
      // midday. The moon keeps to the upper right.
      const progress = Math.min(1, Math.max(0, (hour - 6) / 14))
      const x = phase === 'night' ? 78 : 10 + progress * 80
      // Kept below the floating navigation even at its highest.
      const y = phase === 'night' ? 22 : 66 - Math.sin(progress * Math.PI) * 46

      container.dataset.phase = phase
      container.style.setProperty('--orb-x', `${x.toFixed(1)}%`)
      container.style.setProperty('--orb-y', `${y.toFixed(1)}%`)
    }

    update()
    const timer = window.setInterval(update, REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="ambient-background"
      data-variant="daylight"
      ref={containerRef}
    >
      <div className="daylight-sky" />
      <div className="daylight-stars" />
      <div className="daylight-orb" />
    </div>
  )
}
