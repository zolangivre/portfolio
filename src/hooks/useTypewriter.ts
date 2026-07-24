'use client'

import { useEffect, useState } from 'react'

/**
 * Reveals `text` one character at a time, like it's being typed live.
 * Starts after `delay` (roughly when a fade-in entrance finishes, so typing
 * doesn't run underneath still-translucent text) and skips straight to the
 * full text for prefers-reduced-motion. Shared by the homepage Hero title
 * and any other title reusing the same entrance (project/journal details).
 */
export function useTypewriter(text: string, speed = 55, delay = 550) {
  const [length, setLength] = useState(0)

  useEffect(() => {
    let index = 0
    let interval: number | undefined
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Both branches set state from inside this callback, not synchronously in
    // the effect body — it only ever fires later (immediately for reduced
    // motion, after `delay` otherwise), which is what lets it reset the
    // count when `text` changes without causing a render-time state update.
    const timeout = window.setTimeout(
      () => {
        if (prefersReducedMotion || text.length === 0) {
          setLength(text.length)
          return
        }

        setLength(0)
        interval = window.setInterval(() => {
          index += 1
          setLength(index)

          if (index >= text.length && interval !== undefined) {
            window.clearInterval(interval)
          }
        }, speed)
      },
      prefersReducedMotion ? 0 : delay,
    )

    return () => {
      window.clearTimeout(timeout)
      if (interval !== undefined) {
        window.clearInterval(interval)
      }
    }
  }, [text, speed, delay])

  return length
}
