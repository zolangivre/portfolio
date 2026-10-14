'use client'

import { useEffect, useRef } from 'react'

type CardVideoProps = {
  ariaLabel: string
  className?: string
  height: number
  src: string
  width: number
}

/**
 * A screen recording inside a card's device mockup: it rests on its first
 * frame and plays only while a mouse is over the card — a preview the
 * visitor asks for by pointing, which stops when they leave (so it needs no
 * pause button, unlike the page's own loop, MockupVideo). Nothing plays on
 * touch screens or under reduced motion, and a grid of cards never decodes
 * more than the one being looked at.
 *
 * The `#t` fragment makes Safari paint that first frame from metadata alone;
 * without it, a paused video with `preload="metadata"` stays blank there.
 */
export function CardVideo({ ariaLabel, className, height, src, width }: CardVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const card = video?.closest<HTMLElement>('.card-glow')

    if (!video || !card) {
      return
    }

    const canPreview = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )

    const onEnter = () => {
      // The light/dark twin the current theme hides (`display: none`) has no
      // box: playing it would download and decode a loop nobody sees.
      if (canPreview.matches && video.getClientRects().length > 0) {
        void video.play().catch(() => {})
      }
    }
    // Back to the frame the card rests on, so the next hover starts over.
    const onLeave = () => {
      video.pause()
      video.currentTime = 0
    }

    card.addEventListener('pointerenter', onEnter)
    card.addEventListener('pointerleave', onLeave)

    return () => {
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointerleave', onLeave)
    }
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
      src={`${src}#t=0.001`}
      width={width}
    />
  )
}
