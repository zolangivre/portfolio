'use client'

import { useEffect, useRef } from 'react'

type MockupVideoProps = {
  ariaLabel: string
  className?: string
  height: number
  src: string
  width: number
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
 */
export function MockupVideo({ ariaLabel, className, height, src, width }: MockupVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Muted inline playback is allowed without a gesture, but a browser
          // can still refuse (low power mode, for one) — the first frame
          // stays up then.
          void video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })

    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  return (
    <video
      aria-label={ariaLabel}
      className={className}
      height={height}
      loop
      muted
      playsInline
      preload="metadata"
      ref={videoRef}
      src={src}
      width={width}
    />
  )
}
