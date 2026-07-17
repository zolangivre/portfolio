'use client'

import Image from 'next/image'
import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

type GalleryImage = {
  id: number
  src: string
  alt: string
  width?: number
  height?: number
}

type MediaGalleryProps = {
  ariaLabel?: string
  closeLabel: string
  images: GalleryImage[]
  nextLabel: string
  previousLabel: string
}

export function MediaGallery({
  ariaLabel,
  closeLabel,
  images,
  nextLabel,
  previousLabel,
}: MediaGalleryProps) {
  const [index, setIndex] = useState(-1)

  return (
    <>
      <div aria-label={ariaLabel} className="media-gallery">
        {images.map((image, imageIndex) => (
          <button
            aria-label={image.alt}
            className="media-gallery-item"
            key={image.id}
            onClick={() => setIndex(imageIndex)}
            type="button"
          >
            <Image
              alt={image.alt}
              className="rounded-[20px] bg-surface"
              height={image.height ?? 1200}
              sizes="(min-width: 720px) 33vw, 50vw"
              src={image.src}
              width={image.width ?? 1600}
            />
          </button>
        ))}
      </div>

      <Lightbox
        close={() => setIndex(-1)}
        index={index}
        labels={{ Close: closeLabel, Next: nextLabel, Previous: previousLabel }}
        open={index >= 0}
        plugins={[Zoom]}
        slides={images.map((image) => ({
          alt: image.alt,
          height: image.height,
          src: image.src,
          width: image.width,
        }))}
      />
    </>
  )
}
