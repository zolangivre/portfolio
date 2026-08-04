'use client'

import { useState, type ImgHTMLAttributes } from 'react'

type FadeImageProps = {
  alt: string
  src: string
  /** Candidate list from getMediaSrcSet(). Omitted when there are no derivatives. */
  srcSet?: string
  /** Required for the browser to pick from srcSet before layout is known. */
  sizes?: string
  /** Intrinsic dimensions, used to reserve space. Not needed with `fill`. */
  width?: number
  height?: number
  /**
   * Stretch to cover the nearest positioned ancestor, replacing next/image's
   * `fill`. The parent must be `relative` and size itself.
   */
  fill?: boolean
  className?: string
  /** Above-the-fold image: loads eagerly and skips the fade so LCP isn't delayed. */
  priority?: boolean
} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'alt' | 'src' | 'srcSet' | 'sizes' | 'width' | 'height' | 'className'
>

/**
 * Renders Payload media with a real srcset.
 *
 * Deliberately a plain <img> rather than next/image: media is served straight
 * from the R2 custom domain and `images.unoptimized` is on, so next/image was
 * already emitting a bare <img> — but it also overrides any srcSet passed to
 * it, which is the one attribute that makes responsive images work. Going
 * direct restores srcset while keeping Vercel's image optimizer, and its
 * per-transformation cost, out of the path entirely.
 */
export function FadeImage({
  className,
  fill = false,
  onLoad,
  priority = false,
  sizes,
  srcSet,
  style,
  ...props
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false)

  // Fading in the LCP image delays it, so eager images skip the transition.
  const fadeClass = priority
    ? ''
    : `transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`

  return (
    <img
      {...props}
      className={`${fill ? 'absolute inset-0 h-full w-full ' : ''}${fadeClass}${className ? ` ${className}` : ''}`}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      // `sizes` without `srcSet` does nothing, so only emit the pair together.
      sizes={srcSet ? sizes : undefined}
      srcSet={srcSet}
      style={style}
    />
  )
}
