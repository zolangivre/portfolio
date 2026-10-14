'use client'

import Image, { type ImageProps } from 'next/image'
import { useCallback, useState } from 'react'

export function FadeImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  // With a blurred preview the image is never empty: the preview shows at
  // once and the photo sharpens over it, so there's nothing to fade in.
  const visible = loaded || props.placeholder === 'blur'

  // An image already in the cache (the card it was just shown in, on the way
  // to its page) is complete the moment it mounts: show it straight away
  // rather than fading in something that's already there. It also has to be
  // visible right then — a view transition snapshots the new page during the
  // commit, and would otherwise morph a card into an empty box.
  const ref = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [])

  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and forwarded via props
    <Image
      {...props}
      className={`transition-opacity duration-(--duration-base) ease-out ${visible ? 'opacity-100' : 'opacity-0'}${className ? ` ${className}` : ''}`}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      ref={ref}
    />
  )
}
