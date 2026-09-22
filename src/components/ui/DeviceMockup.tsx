import { FadeImage } from '@/components/ui/FadeImage'
import { MockupVideo } from '@/components/ui/MockupVideo'
import { getMediaUrl, isVideo } from '@/lib/media'
import type { Media } from '@/payload-types'

export type MockupFrame = 'phone' | 'desktop' | 'custom'

/** What each frame asks of the media once the page's docs are resolved. */
type FrameProps = {
  alt: string
  darkSrc: string | null
  height: number
  /** Of the media actually shown; a screen recording is played, not shown. */
  mimeType?: string | null
  priority?: boolean
  src: string
  width: number
}

type MockupMediaProps = FrameProps & {
  /** Applied to the light and the dark element alike. */
  className: string
  sizes: string
}

/**
 * What fills the frame: a capture, or a screen recording of the project
 * walking through itself. Both honour the light/dark pair — only the variant
 * the current theme shows is marked `priority`, so a hidden twin never
 * competes with the real LCP image for early bandwidth.
 */
function MockupMedia({
  alt,
  className,
  darkSrc,
  height,
  mimeType,
  priority,
  sizes,
  src,
  width,
}: MockupMediaProps) {
  const renderOne = (mediaSrc: string, mediaClassName: string, isLight: boolean) =>
    isVideo(mimeType) ? (
      <MockupVideo
        ariaLabel={alt}
        className={mediaClassName}
        height={height}
        src={mediaSrc}
        width={width}
      />
    ) : (
      <FadeImage
        alt={alt}
        className={mediaClassName}
        height={height}
        priority={isLight ? priority : undefined}
        sizes={sizes}
        src={mediaSrc}
        width={width}
      />
    )

  return (
    <>
      {renderOne(src, `${className}${darkSrc ? ' dark:hidden' : ''}`, true)}
      {darkSrc ? renderOne(darkSrc, `hidden dark:block ${className}`, false) : null}
    </>
  )
}

/**
 * What goes behind the glass. Cropped from the top (`object-top`) rather than
 * centred: a first screen keeps its header and hero visible when the capture
 * is a little taller than the device it is placed in.
 */
function Screen(props: Omit<MockupMediaProps, 'className'>) {
  return <MockupMedia {...props} className="h-full w-full object-cover object-top" />
}

/*
 * Both frames are drawn in CSS rather than shipped as images, so they stay
 * crisp at any size and follow the site's own shadows. Every inner offset is
 * a percentage of the device box — that keeps the bezels proportional whether
 * the phone renders at 240px or 420px tall. The radii are named because the
 * shell and the highlight that traces its edge have to stay in step.
 */
const shellClassName =
  'bg-linear-to-br from-neutral-600 via-neutral-800 to-neutral-900 shadow-[0_40px_80px_-32px_rgb(var(--shadow-color)/0.55)]'
const edgeHighlightClassName =
  'pointer-events-none absolute inset-0 ring-1 ring-white/15 ring-inset'
const phoneRadius = '13% / 6%'
const lidRadius = '2.6% / 4.04%'

function PhoneFrame(props: FrameProps) {
  return (
    <div className="relative h-full" style={{ aspectRatio: '9 / 19.5' }}>
      {/* Volume rocker and side button, just enough of them to read as a phone. */}
      <span
        aria-hidden="true"
        className="absolute rounded-l-full bg-neutral-700"
        style={{ height: '6%', left: '-0.9%', top: '20%', width: '1%' }}
      />
      <span
        aria-hidden="true"
        className="absolute rounded-l-full bg-neutral-700"
        style={{ height: '6%', left: '-0.9%', top: '28%', width: '1%' }}
      />
      <span
        aria-hidden="true"
        className="absolute rounded-r-full bg-neutral-700"
        style={{ height: '9%', right: '-0.9%', top: '24%', width: '1%' }}
      />

      <div className={`absolute inset-0 ${shellClassName}`} style={{ borderRadius: phoneRadius }}>
        <div
          className="absolute overflow-hidden bg-black"
          style={{ borderRadius: '11.5% / 5.3%', inset: '1.3% 2.8%' }}
        >
          {/* The phone is height-driven, so its width never tracks the
              viewport: ~237px at lg, ~202px at sm, ~167px below that. */}
          <Screen {...props} sizes="(min-width: 1024px) 240px, (min-width: 640px) 205px, 170px" />
        </div>

        {/* No Dynamic island drawn here: a simulator capture already has one,
            and a second would sit on top of it. */}

        {/* Light catching the polished edge. */}
        <span
          aria-hidden="true"
          className={edgeHighlightClassName}
          style={{ borderRadius: phoneRadius }}
        />
      </div>
    </div>
  )
}

/**
 * The lid is 16/10.24 rather than a MacBook's outer 16/10.6: what has to match
 * the capture is the screen *inside* the bezels, and those proportions put it
 * at 1.592 — the shape of a 1400x879 Chrome window, so a screen recording of
 * one fills it with nothing trimmed off the edges.
 */
function DesktopFrame(props: FrameProps) {
  return (
    <div className="flex w-[78%] flex-col items-center">
      {/* Lid */}
      <div
        className={`relative w-full ${shellClassName}`}
        style={{ aspectRatio: '16 / 10.24', borderRadius: lidRadius }}
      >
        <div
          className="absolute overflow-hidden bg-black"
          style={{ borderRadius: '0.9% / 1.45%', inset: '2.6% 1.7%' }}
        >
          {/* The lid is 78% of the container and the screen sits 1.7% inside
              it, so the glass is ~75vw — ~874px at the widest container. */}
          <Screen {...props} sizes="(min-width: 1200px) 880px, 75vw" />
        </div>
        <span
          aria-hidden="true"
          className="absolute rounded-full bg-neutral-500/70"
          style={{
            height: '0.9%',
            left: '50%',
            top: '1%',
            transform: 'translateX(-50%)',
            width: '0.5%',
          }}
        />
        <span
          aria-hidden="true"
          className={edgeHighlightClassName}
          style={{ borderRadius: lidRadius }}
        />
      </div>

      {/* Base: wider than the lid, with the thumb groove at its centre. */}
      <div
        aria-hidden="true"
        className="relative w-[116%] bg-linear-to-b from-neutral-600 via-neutral-700 to-neutral-800 shadow-[0_24px_40px_-22px_rgb(var(--shadow-color)/0.65)]"
        style={{ aspectRatio: '116 / 2.6', borderRadius: '0 0 10% 10% / 0 0 100% 100%' }}
      >
        <span className="absolute left-1/2 top-0 h-[44%] w-[13%] -translate-x-1/2 rounded-b-full bg-neutral-900/70" />
      </div>
    </div>
  )
}

/**
 * A mockup that was composed elsewhere (Figma, a mockup generator…) and
 * uploaded ready-made: shown as-is, with nothing drawn around it. Works best
 * as a PNG on a transparent background, since it sits straight on the page.
 */
function CustomFrame(props: FrameProps) {
  return (
    <MockupMedia
      {...props}
      className="h-auto max-h-[26rem] w-auto max-w-full object-contain sm:max-h-[32rem] lg:max-h-[38rem]"
      sizes="(min-width: 1200px) 1160px, 100vw"
    />
  )
}

/*
 * Each frame renders the media at its own nominal resolution when the upload
 * has no intrinsic size of its own (videos usually don't) — otherwise the
 * real dimensions win, for every frame alike.
 */
const FRAMES: Record<
  MockupFrame,
  { Component: (props: FrameProps) => React.ReactElement; height: number; width: number }
> = {
  custom: { Component: CustomFrame, height: 1000, width: 1600 },
  desktop: { Component: DesktopFrame, height: 1206, width: 1920 },
  phone: { Component: PhoneFrame, height: 1950, width: 900 },
}

type DeviceMockupProps = {
  /** Shown when the chosen upload carries no alt of its own. */
  fallbackAlt: string
  frame: MockupFrame
  image?: (number | null) | Media
  imageDark?: (number | null) | Media
  priority?: boolean
}

const asMedia = (media: (number | null) | Media | undefined): Media | null =>
  media && typeof media === 'object' ? media : null

/**
 * The first screen of a project shown inside the device it was built for —
 * an iPhone for mobile apps, a MacBook for the web — instead of a logo on
 * empty space. The device sits straight on the page, with no panel behind it.
 * Cards keep the cover image; this is the detail page's opener.
 *
 * Takes the uploads themselves rather than pre-resolved URLs, so that a
 * project with *only* a dark mockup still gets that file's alt, mime type and
 * dimensions instead of silently falling back to the light slot's.
 */
export function DeviceMockup({
  fallbackAlt,
  frame,
  image,
  imageDark,
  priority,
}: DeviceMockupProps) {
  const light = asMedia(image)
  const dark = asMedia(imageDark)
  // A dark-only upload is promoted to the main slot rather than rendered as a
  // twin of nothing — so it is never also the dark variant.
  const primary = light ?? dark
  const secondary = light ? dark : null
  const src = getMediaUrl(primary)

  if (!primary || !src) {
    return null
  }

  const { Component, height, width } = FRAMES[frame]

  return (
    <div
      className={`relative mt-8 flex w-full items-center justify-center ${
        frame === 'phone'
          ? 'h-[26rem] py-4 sm:h-[32rem] sm:py-6 lg:h-[38rem] lg:py-8'
          : 'py-2 sm:py-4'
      }`}
    >
      <Component
        alt={primary.alt || fallbackAlt}
        darkSrc={getMediaUrl(secondary)}
        height={primary.height ?? height}
        mimeType={primary.mimeType}
        priority={priority}
        src={src}
        width={primary.width ?? width}
      />
    </div>
  )
}
