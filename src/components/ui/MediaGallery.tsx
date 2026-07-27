'use client'

import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

import { FadeImage } from './FadeImage'
import { Reveal } from './Reveal'

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
          <Reveal
            blur={8}
            delay={Math.min(imageIndex, 5) * 0.08}
            key={image.id}
            scale={0.92}
          >
            <button
              aria-label={image.alt}
              className="media-gallery-item relative"
              data-cursor="pointer"
              data-cursor-scale="2.1"
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
                    <span className="media-gallery-play-badge flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white">
                      <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </>
              ) : (
                <FadeImage
                  alt={image.alt}
                  className="rounded-[20px] bg-surface"
                  height={image.height ?? 1200}
                  sizes="(min-width: 720px) 33vw, 50vw"
                  src={image.src}
                  width={image.width ?? 1600}
                />
              )}
              <span aria-hidden="true" className="media-gallery-overlay rounded-[20px]" />
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox
        animation={{
          easing: {
            fade: 'cubic-bezier(0.22,1,0.36,1)',
            navigation: 'cubic-bezier(0.22,1,0.36,1)',
            swipe: 'cubic-bezier(0.22,1,0.36,1)',
          },
          fade: 350,
          swipe: 450,
        }}
        close={() => setIndex(-1)}
        index={index}
        labels={{ Close: closeLabel, Next: nextLabel, Previous: previousLabel }}
        open={index >= 0}
        plugins={[Zoom, Video]}
        styles={{
          container: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'color-mix(in srgb, var(--yarl__color_backdrop) 82%, transparent)',
          },
        }}
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
