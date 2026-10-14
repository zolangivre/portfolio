'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

import { isVideo } from '@/lib/media'

import { FadeImage } from './FadeImage'
import { Reveal } from './Reveal'

type GalleryImage = {
  /** `<collection>-<id>`: ids alone are not unique across media and videos. */
  id: string
  src: string
  alt: string
  mimeType?: string | null
  /** Blurred preview shown while the photo loads (Payload, see placeholder.ts). */
  placeholder?: string | null
  width?: number
  height?: number
}

/** The one name the open photo and its thumbnail share while one morphs into the other. */
const MORPH_NAME = 'gallery-photo'

type ViewTransitionDocument = Document & {
  startViewTransition: (update: () => void | Promise<void>) => { finished: Promise<void> }
}

function canMorph(): boolean {
  return (
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The photo or video on the lightbox's current slide. */
function lightboxMedia() {
  return document.querySelector<HTMLElement>('.yarl__slide_current img, .yarl__slide_current video')
}

/**
 * Polls for the lightbox's current photo: the lightbox mounts its portal a
 * render or two after `open` flips, and a photo still loading would morph
 * into an empty box. Timers rather than requestAnimationFrame, which the
 * browser holds back while a view transition's update is pending.
 */
async function waitForLightboxMedia(timeout = 400): Promise<HTMLElement | null> {
  const start = performance.now()

  while (performance.now() - start < timeout) {
    const media = lightboxMedia()

    if (media && (!(media instanceof HTMLImageElement) || media.complete)) {
      return media
    }

    await new Promise((resolve) => setTimeout(resolve, 16))
  }

  return lightboxMedia()
}

/**
 * Runs `update` as a gallery view transition. The flag on <html> keeps the
 * page itself from cross-fading (globals.css): only the photo travels.
 */
function runMorph(update: () => void | Promise<void>): Promise<void> {
  const root = document.documentElement

  root.dataset.galleryTransition = ''

  return (document as ViewTransitionDocument).startViewTransition(update).finished.finally(() => {
    delete root.dataset.galleryTransition
  })
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
  // While a morph runs the lightbox drops its own opening scale (see
  // .yarl__portal.is-morphing): the photo is already travelling into place.
  const [morphing, setMorphing] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  // The slide on screen, which changes as the visitor swipes through.
  const viewedRef = useRef(-1)

  const thumbnail = (at: number) =>
    galleryRef.current
      ?.querySelector(`[data-gallery-index="${at}"]`)
      ?.querySelector<HTMLElement>('img, video') ?? null

  /*
   * Opening and closing are view transitions: the thumbnail and the open
   * photo take turns carrying one name, so the browser moves a single photo
   * between the grid and the full screen — it grows out of the tile that was
   * clicked and shrinks back into the tile of whichever photo is showing when
   * the lightbox closes. The backdrop keeps its own fade underneath
   * (data-gallery-transition stops the page itself from cross-fading).
   */
  function open(at: number) {
    viewedRef.current = at
    const from = thumbnail(at)

    if (!canMorph() || !from) {
      setIndex(at)

      return
    }

    from.style.viewTransitionName = MORPH_NAME
    void runMorph(async () => {
      from.style.viewTransitionName = ''
      flushSync(() => {
        setMorphing(true)
        setIndex(at)
      })

      const to = await waitForLightboxMedia()

      if (to) {
        to.style.viewTransitionName = MORPH_NAME
      }
    }).finally(() => {
      const to = lightboxMedia()

      if (to) {
        to.style.viewTransitionName = ''
      }

      setMorphing(false)
    })
  }

  // The lightbox only calls `close` once its fade is over; `exiting` fires
  // as it starts, which is when the photo has to set off back to its tile.
  function onExiting() {
    const from = lightboxMedia()
    const to = thumbnail(viewedRef.current)

    if (!canMorph() || !from || !to) {
      return
    }

    from.style.viewTransitionName = MORPH_NAME
    void runMorph(() => {
      from.style.viewTransitionName = ''
      // The lightbox fades out live underneath; its copy of the photo
      // must not linger in that fade while the morph carries it home.
      from.style.visibility = 'hidden'
      to.style.viewTransitionName = MORPH_NAME
    }).finally(() => {
      to.style.viewTransitionName = ''
    })
  }

  return (
    <>
      <div aria-label={ariaLabel} className="media-gallery" ref={galleryRef} role="group">
        {images.map((image, imageIndex) => (
          <Reveal delay={Math.min(imageIndex, 5) * 0.08} key={image.id} scale={0.92}>
            <button
              aria-label={image.alt}
              className="media-gallery-item relative"
              data-cursor="pointer"
              data-cursor-scale="2.1"
              data-gallery-index={imageIndex}
              onClick={() => open(imageIndex)}
              type="button"
            >
              {isVideo(image.mimeType) ? (
                <>
                  <video
                    className="rounded-inset bg-surface"
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
                  {...(image.placeholder
                    ? { blurDataURL: image.placeholder, placeholder: 'blur' as const }
                    : {})}
                  alt={image.alt}
                  className="rounded-inset bg-surface"
                  height={image.height ?? 1200}
                  sizes="(min-width: 720px) 33vw, 50vw"
                  src={image.src}
                  width={image.width ?? 1600}
                />
              )}
              <span aria-hidden="true" className="media-gallery-overlay rounded-inset" />
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox
        carousel={{
          // Without intrinsic width/height on the <img>, the browser has no
          // aspect ratio to reserve until the file loads, so it briefly sizes
          // the slide to the default replaced-element box (~2:1, landscape).
          // Landscape images barely move when the real size lands; portrait
          // images snap from wide to tall, reading as a jump behind the
          // opening animation instead of a smooth reveal.
          imageProps: (slide) =>
            slide.width && slide.height ? { height: slide.height, width: slide.width } : {},
        }}
        animation={{
          easing: {
            fade: 'cubic-bezier(0.22,1,0.36,1)',
            navigation: 'cubic-bezier(0.22,1,0.36,1)',
            swipe: 'cubic-bezier(0.22,1,0.36,1)',
          },
          // The fade covers the backdrop, so keep it short — a long one reads
          // as the background being late. The slower part of the opening is
          // the slide's scale (see .yarl__slide), which happens over the top.
          fade: 200,
          swipe: 450,
        }}
        className={morphing ? 'is-morphing' : undefined}
        close={() => setIndex(-1)}
        // The photo follows the finger down and the backdrop fades with it,
        // so dismissing is a throw rather than a hunt for the close button.
        controller={{ closeOnPullDown: true }}
        index={index}
        labels={{ Close: closeLabel, Next: nextLabel, Previous: previousLabel }}
        on={{
          exiting: onExiting,
          view: ({ index: viewed }) => {
            viewedRef.current = viewed
          },
        }}
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
