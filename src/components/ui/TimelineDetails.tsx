'use client'

import { animate, type AnimationPlaybackControls } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { springMove } from '@/lib/motion/tokens'

type TimelineDetailsProps = {
  children: ReactNode
  hideLabel: string
  showLabel: string
}

/** The fold never lands shorter than this, even after a one-line opener… */
const MIN_FOLD_PX = 80
/** …nor lower than ~5 lines, when the text is one long paragraph. */
const MAX_FOLD_PX = 140
/** Content barely taller than the fold isn't worth a button. */
const SLACK_PX = 24

/**
 * The description of an experience or a school, folded on phones: its first
 * paragraph (or its first five lines or so) shows — the summary — fading out, with "Show details" to open
 * the rest. Long narratives cost several screens each on a phone; this keeps
 * the timeline scannable and the detail one tap away. From 720px it's all
 * shown and the button is gone (styles.css).
 *
 * Opening and closing animate the height on the default spring, from
 * wherever it is right now — tap again mid-way and it turns around without
 * a jump. Reduced motion just switches.
 */
export function TimelineDetails({ children, hideLabel, showLabel }: TimelineDetailsProps) {
  const id = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationPlaybackControls | null>(null)
  const [expanded, setExpanded] = useState(false)
  // Whether there's anything beyond the fold; until measured, assume so.
  const [foldable, setFoldable] = useState(true)

  // The fold sits under the first block of the text (its opening paragraph).
  useEffect(() => {
    const body = bodyRef.current

    if (!body) {
      return
    }

    const measure = () => {
      const first = body.querySelector<HTMLElement>('.rich-text > *')
      const fold = Math.min(
        MAX_FOLD_PX,
        Math.max(MIN_FOLD_PX, first ? first.offsetTop + first.offsetHeight : 0),
      )

      body.style.setProperty('--fold-height', `${fold}px`)
      setFoldable(body.scrollHeight > fold + SLACK_PX)
    }

    measure()
    // Watches the text, not the body: the body's own height is what the
    // open/close animation changes every frame; the text only resizes when
    // the width does.
    const observer = new ResizeObserver(measure)
    const content = body.firstElementChild

    observer.observe(content ?? body)

    return () => {
      observer.disconnect()
      animationRef.current?.stop()
    }
  }, [])

  const toggle = () => {
    const body = bodyRef.current

    if (!body) {
      return
    }

    const next = !expanded
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    setExpanded(next)
    animationRef.current?.stop()

    // Where it is on screen right now — mid-animation, if it was moving.
    const from = body.getBoundingClientRect().height

    if (next) {
      body.dataset.folded = 'false'
    }

    if (reduceMotion) {
      body.style.height = ''
      body.dataset.folded = next ? 'false' : 'true'

      return
    }

    const fold = parseFloat(body.style.getPropertyValue('--fold-height')) || MIN_FOLD_PX
    const to = next ? body.scrollHeight : fold

    body.style.height = `${from}px`
    const animation = animate(body, { height: `${to}px` }, springMove)

    animationRef.current = animation
    void animation.then(() => {
      // A newer tap took over: its own animation will finish the job.
      if (animationRef.current !== animation) {
        return
      }

      body.style.height = ''

      // Folded only once it has actually arrived closed.
      if (!next) {
        body.dataset.folded = 'true'
      }
    })
  }

  return (
    <div className="timeline-details" data-foldable={foldable}>
      <div className="timeline-details-body" data-folded="true" id={id} ref={bodyRef}>
        {children}
      </div>
      <button
        aria-controls={id}
        aria-expanded={expanded}
        className="timeline-details-toggle"
        onClick={toggle}
        type="button"
      >
        {expanded ? hideLabel : showLabel}
        <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </button>
    </div>
  )
}
