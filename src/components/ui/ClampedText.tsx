'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type ClampedTextProps = {
  children: ReactNode
  className?: string
  lessLabel: string
  moreLabel: string
}

/**
 * A paragraph held to six lines, with "Read more" when there's more: one
 * long testimonial no longer stretches every card in its row to its height.
 * The button only appears when the text is actually cut.
 */
export function ClampedText({ children, className, lessLabel, moreLabel }: ClampedTextProps) {
  const id = useId()
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const text = ref.current

    // Opened, the text is never cut: keep the last answer so the button
    // stays there to close it.
    if (!text || expanded) {
      return
    }

    const measure = () => setClamped(text.scrollHeight > text.clientHeight + 1)
    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(text)

    return () => observer.disconnect()
  }, [expanded])

  return (
    <div>
      <p
        className={[className, expanded ? null : 'line-clamp-6'].filter(Boolean).join(' ')}
        id={id}
        ref={ref}
      >
        {children}
      </p>
      {clamped ? (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          className="link-underline mt-3 text-sm font-medium text-fg transition hover:text-accent"
          onClick={() => setExpanded((open) => !open)}
          type="button"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  )
}
