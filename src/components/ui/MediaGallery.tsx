'use client'

import Image from 'next/image'
import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

type GalleryImage = {
  id: number
  src: string
  alt: string
  mimeType?: string | null
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

const isVideo = (mimeType?: string | null) => Boolean(mimeType?.startsWith('video/'))

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
            className="media-gallery-item relative"
            key={image.id}
            onClick={() => setIndex(imageIndex)}
            type="button"
          >
            {isVideo(image.mimeType) ? (
              <>
                <video
                  className="rounded-[20px] bg-surface"
                  height={image.height ?? 1200}
                  muted
                  playsInline
                  preload="metadata"
                  src={image.src}
                  width={image.width ?? 1600}
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white">
                    <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </>
            ) : (
              <Image
                alt={image.alt}
                className="rounded-[20px] bg-surface"
                height={image.height ?? 1200}
                sizes="(min-width: 720px) 33vw, 50vw"
                src={image.src}
                width={image.width ?? 1600}
              />
            )}
          </button>
        ))}
      </div>

      <Lightbox
        close={() => setIndex(-1)}
        index={index}
        labels={{ Close: closeLabel, Next: nextLabel, Previous: previousLabel }}
        open={index >= 0}
        plugins={[Zoom, Video]}
        slides={images.map((image) =>
          isVideo(image.mimeType)
            ? {
                type: 'video' as const,
                width: image.width,
                height: image.height,
                controls: true,
                sources: [{ src: image.src, type: image.mimeType ?? 'video/mp4' }],
              }
            : {
                alt: image.alt,
                height: image.height,
                src: image.src,
                width: image.width,
              },
        )}
      />
    </>
  )
}
