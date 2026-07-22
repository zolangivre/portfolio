'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

export function FadeImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and forwarded via props
    <Image
      {...props}
      className={`transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}${className ? ` ${className}` : ''}`}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
    />
  )
}
