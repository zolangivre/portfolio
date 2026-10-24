'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, type ReactNode } from 'react'

type SafeImageProps = ImageProps & {
  /** Rendered instead when the file fails to load; nothing by default. */
  fallback?: ReactNode
}

/**
 * next/image that steps aside when its file is gone (an upload deleted from
 * storage, a broken URL): the browser's broken-image icon never shows, and a
 * logo next to a name simply isn't there. next/image re-fires an error that
 * happened before hydration, so this also catches files that 404 on first
 * paint.
 */
export function SafeImage({ fallback = null, onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return fallback
  }

  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and forwarded via props
    <Image
      {...props}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}
