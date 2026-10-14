'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

type Shape = {
  /** Horizontal position, % of the screen width. */
  left: number
  /** Vertical position, % of the layer's height (which spans the whole page). */
  top: number
  /** Width, in vw. */
  size: number
  /** Organic, hand-drawn-looking outline. */
  radius: string
  tone: 'accent' | 'accent-2'
  /** Resting tilt, in degrees. */
  turn: number
}

/*
 * Three depths, nearest last. The far layer drifts at a fraction of the
 * scroll, the near one at several times that (styles.css) — the gap between
 * those speeds is what reads as space. Far shapes are smaller, fainter and
 * softly out of focus; near ones are larger and crisp, like a lens.
 */
const LAYERS: { depth: 'far' | 'mid' | 'near'; shapes: Shape[] }[] = [
  {
    depth: 'far',
    shapes: [
      {
        left: 8,
        top: 6,
        size: 9,
        radius: '58% 42% 63% 37% / 46% 55% 45% 54%',
        tone: 'accent',
        turn: 12,
      },
      {
        left: 78,
        top: 22,
        size: 7,
        radius: '45% 55% 40% 60% / 55% 45% 60% 40%',
        tone: 'accent-2',
        turn: -8,
      },
      {
        left: 30,
        top: 48,
        size: 8,
        radius: '62% 38% 54% 46% / 40% 60% 42% 58%',
        tone: 'accent-2',
        turn: 20,
      },
      {
        left: 86,
        top: 70,
        size: 10,
        radius: '50% 50% 38% 62% / 58% 42% 58% 42%',
        tone: 'accent',
        turn: -15,
      },
      {
        left: 12,
        top: 88,
        size: 7,
        radius: '40% 60% 55% 45% / 50% 50% 45% 55%',
        tone: 'accent',
        turn: 6,
      },
    ],
  },
  {
    depth: 'mid',
    shapes: [
      {
        left: 70,
        top: 8,
        size: 13,
        radius: '55% 45% 60% 40% / 45% 55% 40% 60%',
        tone: 'accent-2',
        turn: -10,
      },
      {
        left: 4,
        top: 34,
        size: 12,
        radius: '42% 58% 48% 52% / 60% 40% 55% 45%',
        tone: 'accent',
        turn: 14,
      },
      {
        left: 60,
        top: 58,
        size: 11,
        radius: '60% 40% 45% 55% / 50% 55% 45% 50%',
        tone: 'accent',
        turn: -22,
      },
      {
        left: 22,
        top: 80,
        size: 14,
        radius: '48% 52% 62% 38% / 42% 58% 42% 58%',
        tone: 'accent-2',
        turn: 9,
      },
    ],
  },
  {
    depth: 'near',
    shapes: [
      {
        left: -4,
        top: 14,
        size: 19,
        radius: '57% 43% 50% 50% / 48% 52% 48% 52%',
        tone: 'accent',
        turn: -6,
      },
      {
        left: 84,
        top: 42,
        size: 17,
        radius: '44% 56% 58% 42% / 56% 44% 56% 44%',
        tone: 'accent-2',
        turn: 18,
      },
      {
        left: 40,
        top: 76,
        size: 18,
        radius: '52% 48% 40% 60% / 60% 40% 52% 48%',
        tone: 'accent',
        turn: -12,
      },
    ],
  },
]

/**
 * "Formes en verre en profondeur": rounded glass pebbles hanging at three
 * depths in front of the page colour. Scrolling moves each depth at its own
 * speed, so the page reads as a space you're travelling through rather
 * than a flat backdrop — visionOS depth, with nothing moving on its own.
 *
 * Scroll-driven in CSS (composited transforms, no per-frame JS); this only
 * measures how far the page scrolls (--scroll-max), which sets how far each
 * layer travels. Reduced motion and browsers without scroll timelines get
 * the still arrangement.
 */
export function SpatialBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      container.style.setProperty('--scroll-max', String(Math.max(0, max)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden="true"
      className="ambient-background"
      data-variant="spatial"
      ref={containerRef}
    >
      {LAYERS.map(({ depth, shapes }) => (
        <div className="spatial-layer" data-depth={depth} key={depth}>
          {shapes.map((shape, index) => (
            <span
              className="spatial-shape"
              data-tone={shape.tone}
              key={index}
              style={
                {
                  '--shape-turn': `${shape.turn}deg`,
                  borderRadius: shape.radius,
                  left: `${shape.left}%`,
                  top: `${shape.top}%`,
                  width: `${shape.size}vw`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
