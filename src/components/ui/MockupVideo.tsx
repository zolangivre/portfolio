'use client'

import { useEffect, useRef, useState } from 'react'

export type MockupVideoLabels = {
  pause: string
  play: string
}

type MockupVideoProps = {
  ariaLabel: string
  className?: string
  height: number
  labels: MockupVideoLabels
  src: string
  /**
   * The light/dark visibility classes, kept apart from `className` so the
   * play/pause button shows and hides together with its own video.
   */
  visibilityClassName?: string
  width: number
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  )
}

/**
 * The silent, looping screen recording shown inside a device mockup.
 *
 * Playback starts here instead of through the `autoPlay` attribute, for two
 * reasons. A visitor who asked for less motion is left on the first frame
 * rather than having the loop start and stop in front of them. And the
 * light/dark pair are both in the DOM, one of them `display:none` — calling
 * `play()` on that one would pull the whole file down and keep decoding a
 * loop nobody can see. A hidden element never intersects, so the observer
 * below never starts it, and `preload="metadata"` stays a range request until
 * the visitor actually switches theme.
 *
 * The loop runs for longer than five seconds, so it comes with a play/pause
 * button (WCAG 2.2.2). Once the visitor pauses it, scrolling it back into view
 * doesn't restart it; under reduced motion it's the only way to start it.
 */
export function MockupVideo({
  ariaLabel,
  className,
  height,
  labels,
  src,
  visibilityClassName = '',
  width,
}: MockupVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Whether the loop should run while on screen: on by default, off under
  // reduced motion, and then whatever the visitor last chose.
  const wantsPlayRef = useRef(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    wantsPlayRef.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && wantsPlayRef.current) {
          // Muted inline playback is allowed without a gesture, but a browser
          // can still refuse (low power mode, for one) — the first frame
          // stays up then.
          void video.play().catch(() => {})
        } else if (!entry.isIntersecting) {
          video.pause()
        }
      }
    })

    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  function togglePlayback() {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (video.paused) {
      wantsPlayRef.current = true
      void video.play().catch(() => {})
    } else {
      wantsPlayRef.current = false
      video.pause()
    }
  }

  return (
    <>
      <video
        aria-label={ariaLabel}
        className={`${visibilityClassName} ${className ?? ''}`}
        height={height}
        loop
        muted
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        preload="metadata"
        ref={videoRef}
        src={src}
        width={width}
      />
      <button
        aria-label={playing ? labels.pause : labels.play}
        className={`${visibilityClassName} absolute bottom-3 right-3 z-10 h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:-outline-offset-2`}
        onClick={togglePlayback}
        type="button"
      >
        {/* The button's own `display` belongs to the light/dark visibility
            classes, so the centering lives on this inner box instead — an
            inline svg left to itself sits on the text baseline, off-centre. */}
        <span className="flex h-full w-full items-center justify-center">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>
    </>
  )
}
