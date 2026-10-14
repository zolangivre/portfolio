'use client'

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import {
  DURATION_FAST,
  projectMomentum,
  rubberband,
  springDrawer,
  springMove,
} from '@/lib/motion/tokens'

type MobileNavToggleProps = {
  children: ReactNode
  closeLabel: string
  openLabel: string
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])'

/** Movement before a press becomes a drag — below it, it's still a tap. */
const DRAG_THRESHOLD = 10

type DragState = {
  active: boolean
  originX: number
  originY: number
  pointerId: number
  startPx: number
  width: number
}

export function MobileNavToggle({ children, closeLabel, openLabel }: MobileNavToggleProps) {
  const [open, setOpen] = useState(false)
  // Lags `open` on the way out: the drawer stays in the accessibility tree
  // until its slide-out has actually finished, so the exit still animates.
  const [visible, setVisible] = useState(false)
  const openRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const draggedRef = useRef(false)
  const reducedMotion = useReducedMotion()

  // The drawer's position as a percentage of its own width: 0 is open, 100
  // is off-screen. A spring-driven motion value rather than a CSS transition
  // so the drawer can be grabbed mid-flight and released with the finger's
  // velocity — a transition can only run to its end. A percentage keeps the
  // server render closed without knowing the drawer's width.
  const offset = useMotionValue(100)
  // Reduced motion swaps the slide for a cross-fade (see settle()).
  const fade = useMotionValue(1)
  const transform = useTransform(offset, (value) => `translateX(${value}%)`)
  const scrimOpacity = useTransform(
    [offset, fade],
    ([position, alpha]: number[]) => Math.min(1, Math.max(0, 1 - position! / 100)) * alpha!,
  )

  const settle = useCallback(
    (next: boolean, released = false) => {
      openRef.current = next
      setOpen(next)

      if (next) {
        setVisible(true)
      }

      const hideOnceClosed = () => {
        if (!openRef.current) {
          setVisible(false)
        }
      }

      if (reducedMotion) {
        if (next) {
          offset.jump(0)
          fade.jump(0)
          animate(fade, 1, { duration: DURATION_FAST, ease: 'easeOut' })
        } else {
          animate(fade, 0, {
            duration: DURATION_FAST,
            ease: 'easeOut',
            onComplete: () => {
              if (!openRef.current) {
                offset.jump(100)
                fade.jump(1)
                setVisible(false)
              }
            },
          })
        }

        return
      }

      // animate() starts from the live value and its current velocity, so a
      // release carries the finger's speed and a re-tap mid-flight reverses
      // smoothly. Bounce only when a drag handed it momentum.
      animate(offset, next ? 0 : 100, {
        ...(released ? springDrawer : springMove),
        onComplete: hideOnceClosed,
      })
    },
    [fade, offset, reducedMotion],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const button = buttonRef.current
    const panel = panelRef.current

    // The open drawer covers the page behind a scrim, so focus has to stay
    // inside it: Tab cycles between the toggle (which closes it) and the
    // drawer's own links and controls, instead of moving on to links the
    // scrim hides.
    const focusables = () => [
      ...(button ? [button] : []),
      ...Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
    ]

    focusables()[1]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        settle(false)
        button?.focus()

        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const items = focusables()
      const first = items[0]
      const last = items[items.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onResize = () => {
      if (window.innerWidth >= 880) {
        openRef.current = false
        offset.jump(100)
        fade.jump(1)
        setOpen(false)
        setVisible(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [fade, offset, open, settle])

  // Swipe right to dismiss. Any press on the drawer starts a candidate drag
  // — including one on a drawer that's still sliding, so it can be caught
  // and thrown back — but it only takes over once it has moved past the
  // threshold horizontally. A mostly-vertical move is left to the browser
  // (`touch-action: pan-y`) to scroll the drawer.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggedRef.current = false

    if (event.button !== 0 || offset.get() >= 100) {
      return
    }

    dragRef.current = {
      active: false,
      originX: event.clientX,
      originY: event.clientY,
      pointerId: event.pointerId,
      startPx: 0,
      width: event.currentTarget.offsetWidth,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - drag.originX

    if (!drag.active) {
      const dy = event.clientY - drag.originY

      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null

        return
      }

      // Re-anchor at the current point so the drawer doesn't jump by the
      // threshold, and pick up from where it is on screen right now.
      offset.stop()
      fade.jump(1)
      drag.active = true
      drag.originX = event.clientX
      drag.startPx = (offset.get() / 100) * drag.width
      draggedRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)

      return
    }

    let px = drag.startPx + dx

    // Already fully open: resist instead of hard-stopping at the edge.
    if (px < 0) {
      px = rubberband(px, drag.width)
    }

    offset.set((px / drag.width) * 100)
  }

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null

    if (!drag.active) {
      return
    }

    // Decide from where the throw is heading, not where the finger let go:
    // a short flick to the right dismisses, a slow drag past halfway that
    // drifts back stays open.
    const projected = offset.get() + projectMomentum(offset.getVelocity())

    settle(projected < 50, true)
  }

  return (
    <>
      <button
        aria-controls="site-nav-panel"
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
        className="nav-toggle"
        data-open={open}
        onClick={() => settle(!openRef.current)}
        ref={buttonRef}
        type="button"
      >
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
      </button>
      <motion.div
        className="site-header-nav"
        data-open={open}
        data-visible={visible}
        id="site-nav-panel"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) {
            settle(false)
          }
        }}
        // A press that turned into a swipe must not also follow the link
        // it started on.
        onClickCapture={(event) => {
          if (draggedRef.current) {
            draggedRef.current = false
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onPointerCancel={onPointerEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        ref={panelRef}
        style={{ opacity: fade, transform }}
      >
        {children}
      </motion.div>
      {/* Pointer-only shortcut: keyboard users close with Escape or the toggle. */}
      <motion.div
        aria-hidden="true"
        className="nav-scrim"
        data-open={open}
        onClick={() => settle(false)}
        style={{ opacity: scrimOpacity }}
      />
    </>
  )
}
