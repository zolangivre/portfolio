'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { rubberband } from '@/lib/motion/tokens'

type ShapeSpec = {
  /** Diameter, in px. */
  size: number
  /** Where it settles on load, as fractions of the screen. */
  at: [number, number]
  radius: string
  tone: 'accent' | 'accent-2'
}

// Settled in the free band between the hero's text (left) and its photo
// (right), and along the bottom of the first screen.
const SHAPES: ShapeSpec[] = [
  { size: 150, at: [0.5, 0.3], radius: '58% 42% 63% 37% / 46% 55% 45% 54%', tone: 'accent' },
  { size: 96, at: [0.62, 0.56], radius: '45% 55% 40% 60% / 55% 45% 60% 40%', tone: 'accent-2' },
  { size: 120, at: [0.44, 0.82], radius: '62% 38% 54% 46% / 40% 60% 42% 58%', tone: 'accent-2' },
  { size: 74, at: [0.38, 0.5], radius: '50% 50% 38% 62% / 58% 42% 58% 42%', tone: 'accent' },
  { size: 180, at: [0.84, 0.88], radius: '42% 58% 48% 52% / 60% 40% 55% 45%', tone: 'accent-2' },
  { size: 88, at: [0.62, 0.16], radius: '55% 45% 60% 40% / 45% 55% 40% 60%', tone: 'accent' },
]

/** Apple's scroll deceleration, per millisecond: a throw coasts, then settles. */
const DECELERATION = 0.998
/** Share of speed kept when bouncing off a screen edge or another shape. */
const RESTITUTION = 0.6
/** Below this speed (px/s) a shape is at rest, and the loop can stop. */
const REST_SPEED = 6
/** How much of the recent pointer path a release's velocity is read from. */
const VELOCITY_WINDOW_MS = 80

type Body = {
  angle: number
  el: HTMLElement
  r: number
  vx: number
  vy: number
  x: number
  y: number
}

type Sample = { t: number; x: number; y: number }

/**
 * "Formes à manipuler": soft shapes at the top of the page that you can
 * grab, drag and throw. They follow the pointer from the exact spot you
 * grabbed them, leave your hand at its speed, coast to a stop like a flicked
 * scroll view, bounce off the screen edges and off each other, and resist
 * — rubber-band — when dragged past an edge. On a phone a tap on one gives
 * it a nudge (a drag there has to stay a scroll).
 *
 * The layer sits behind the content, so it can't be hit-tested: presses are
 * matched to shapes by geometry, and ignored on links, buttons and fields.
 * The loop runs only while something moves. It all fades away over the
 * first screen of scrolling (styles.css), and stays still for reduced
 * motion.
 */
export function PlaygroundBackground() {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current

    if (!layer) {
      return
    }

    const elements = Array.from(layer.querySelectorAll<HTMLElement>('.playground-shape'))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = window.innerWidth
    let height = window.innerHeight

    const bodies: Body[] = elements.map((el, index) => {
      const spec = SHAPES[index]!
      // Measured, not taken from the spec: phones draw the shapes smaller.
      const r = el.offsetWidth / 2
      const x = spec.at[0] * width
      const y = spec.at[1] * height

      // On load each shape glides in from just off the right edge and
      // settles in place — a first hint that these things have weight.
      return reduceMotion
        ? { angle: 0, el, r, vx: 0, vy: 0, x, y }
        : {
            angle: 0,
            el,
            r,
            // Enough speed to coast to its spot under DECELERATION (Apple's
            // projection: distance ≈ v × 0.5 s at 0.998 per ms).
            vx: -(width + r - x) * 2,
            vy: 0,
            x: width + r * 2,
            y,
          }
    })

    const render = (body: Body) => {
      body.el.style.transform = `translate3d(${(body.x - body.r).toFixed(1)}px, ${(body.y - body.r).toFixed(1)}px, 0) rotate(${body.angle.toFixed(1)}deg)`
    }

    bodies.forEach(render)

    if (reduceMotion) {
      return
    }

    let frame = 0
    let last = 0
    let drag: {
      body: Body
      offsetX: number
      offsetY: number
      pointerId: number
      samples: Sample[]
    } | null = null

    const collide = () => {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i]!
          const b = bodies[j]!
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distance = Math.hypot(dx, dy) || 0.001
          const overlap = a.r + b.r - distance

          if (overlap <= 0) {
            continue
          }

          const nx = dx / distance
          const ny = dy / distance
          // A dragged shape is held by the hand: it doesn't give way.
          const aHeld = drag?.body === a
          const bHeld = drag?.body === b
          const massA = aHeld ? Infinity : a.r * a.r
          const massB = bHeld ? Infinity : b.r * b.r
          const shareA = aHeld ? 0 : bHeld ? 1 : massB / (massA + massB)
          const shareB = 1 - shareA

          a.x -= nx * overlap * shareA
          a.y -= ny * overlap * shareA
          b.x += nx * overlap * shareB
          b.y += ny * overlap * shareB

          const approaching = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny

          if (approaching < 0) {
            const inverse = (aHeld ? 0 : 1 / massA) + (bHeld ? 0 : 1 / massB)
            const impulse = (-(1 + RESTITUTION) * approaching) / inverse

            if (!aHeld) {
              a.vx -= (impulse / massA) * nx
              a.vy -= (impulse / massA) * ny
            }

            if (!bHeld) {
              b.vx += (impulse / massB) * nx
              b.vy += (impulse / massB) * ny
            }
          }
        }
      }
    }

    const step = (time: number) => {
      const ms = Math.min(32, time - last || 16)
      const dt = ms / 1000
      const decay = Math.pow(DECELERATION, ms)
      let moving = drag !== null

      last = time

      for (const body of bodies) {
        if (drag?.body === body) {
          continue
        }

        body.vx *= decay
        body.vy *= decay
        body.x += body.vx * dt
        body.y += body.vy * dt
        // Rolling a little in the direction of travel.
        body.angle += body.vx * dt * 0.12

        if (body.x < body.r) {
          body.x = body.r
          body.vx = Math.abs(body.vx) * RESTITUTION
        } else if (body.x > width - body.r) {
          body.x = width - body.r
          body.vx = -Math.abs(body.vx) * RESTITUTION
        }

        if (body.y < body.r) {
          body.y = body.r
          body.vy = Math.abs(body.vy) * RESTITUTION
        } else if (body.y > height - body.r) {
          body.y = height - body.r
          body.vy = -Math.abs(body.vy) * RESTITUTION
        }

        if (Math.hypot(body.vx, body.vy) > REST_SPEED) {
          moving = true
        }
      }

      collide()
      bodies.forEach(render)
      frame = moving ? requestAnimationFrame(step) : 0
    }

    const wake = () => {
      if (frame === 0) {
        last = performance.now()
        frame = requestAnimationFrame(step)
      }
    }

    const bodyAt = (x: number, y: number) =>
      // Topmost first: the last rendered shape is drawn on top.
      [...bodies].reverse().find((body) => Math.hypot(x - body.x, y - body.y) <= body.r)

    // Only while the playground is on screen (it fades out as you scroll).
    const active = () => window.scrollY < window.innerHeight * 0.6

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null

      if (
        !active() ||
        event.button !== 0 ||
        target?.closest('a, button, input, textarea, select, label, [role="button"]')
      ) {
        return
      }

      const body = bodyAt(event.clientX, event.clientY)

      if (!body) {
        return
      }

      // Touch: a drag has to stay a page scroll, so a tap gives a nudge
      // away from the finger instead.
      if (event.pointerType !== 'mouse') {
        const dx = body.x - event.clientX || 1
        const dy = body.y - event.clientY
        const distance = Math.hypot(dx, dy) || 1

        body.vx += (dx / distance) * 900
        body.vy += (dy / distance) * 900
        wake()

        return
      }

      // No text selection starting under the shape being grabbed.
      event.preventDefault()
      body.vx = 0
      body.vy = 0
      drag = {
        body,
        offsetX: event.clientX - body.x,
        offsetY: event.clientY - body.y,
        pointerId: event.pointerId,
        samples: [{ t: event.timeStamp, x: event.clientX, y: event.clientY }],
      }
      document.documentElement.dataset.playgroundGrabbing = ''
      wake()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return
      }

      const { body } = drag
      let x = event.clientX - drag.offsetX
      let y = event.clientY - drag.offsetY

      // Past an edge it still follows, with growing resistance.
      if (x < body.r) {
        x = body.r + rubberband(x - body.r, width)
      } else if (x > width - body.r) {
        x = width - body.r + rubberband(x - (width - body.r), width)
      }

      if (y < body.r) {
        y = body.r + rubberband(y - body.r, height)
      } else if (y > height - body.r) {
        y = height - body.r + rubberband(y - (height - body.r), height)
      }

      body.x = x
      body.y = y
      drag.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY })
      drag.samples = drag.samples.filter(
        (sample) => event.timeStamp - sample.t <= VELOCITY_WINDOW_MS,
      )

      // The held shape's own speed, so what it hits gets batted away.
      const first = drag.samples[0]!
      const span = (event.timeStamp - first.t) / 1000

      if (span > 0) {
        body.vx = (event.clientX - first.x) / span
        body.vy = (event.clientY - first.y) / span
      }

      wake()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return
      }

      const { body, samples } = drag
      const first = samples[0]!
      const span = (event.timeStamp - first.t) / 1000

      // Leaves the hand at the hand's speed; a hand that had stopped lets
      // it go still.
      if (span > 0 && event.timeStamp - samples[samples.length - 1]!.t < VELOCITY_WINDOW_MS) {
        body.vx = (event.clientX - first.x) / span
        body.vy = (event.clientY - first.y) / span
      } else {
        body.vx = 0
        body.vy = 0
      }

      drag = null
      delete document.documentElement.dataset.playgroundGrabbing
      wake()
    }

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      // Crossing the phone breakpoint resizes the shapes (styles.css).
      bodies.forEach((body) => {
        body.r = body.el.offsetWidth / 2
      })
      wake()
    }

    // Without scroll timelines the CSS can't fade the layer: do it here.
    let scrollFrame = 0
    const fadeWithScroll = () => {
      if (scrollFrame !== 0) {
        return
      }

      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0
        layer.style.opacity = String(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.7)))
      })
    }
    const needsScrollFade = !CSS.supports('animation-timeline: scroll()')

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('resize', onResize)

    if (needsScrollFade) {
      window.addEventListener('scroll', fadeWithScroll, { passive: true })
    }

    wake()

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(scrollFrame)
      delete document.documentElement.dataset.playgroundGrabbing
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', fadeWithScroll)
    }
  }, [])

  return (
    <div aria-hidden="true" className="ambient-background" data-variant="playground">
      <div className="playground-layer" ref={layerRef}>
        {SHAPES.map((shape, index) => (
          <span
            className="playground-shape"
            data-tone={shape.tone}
            key={index}
            style={
              {
                '--shape-size': `${shape.size}px`,
                borderRadius: shape.radius,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
