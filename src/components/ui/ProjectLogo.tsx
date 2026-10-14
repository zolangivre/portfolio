import Image from 'next/image'

import { getMediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

type ProjectLogoProps = {
  className: string
  image?: Media | number | null
  imageDark?: Media | number | null
  /** Rendered width in CSS px, for `sizes`. */
  size: number
}

/**
 * A project's cover shown as its logo, straight on the surface it sits on —
 * the uploads are transparent, so no tile or backing behind them. Sized by
 * `className` (height plus a max-width, so a wide wordmark and a square icon
 * read at a similar weight); the intrinsic size keeps the aspect ratio.
 */
export function ProjectLogo({ className, image, imageDark, size }: ProjectLogoProps) {
  const light = typeof image === 'object' ? image : null
  const dark = typeof imageDark === 'object' ? imageDark : null
  const lightUrl = getMediaUrl(light)
  const darkUrl = getMediaUrl(dark)

  if (!lightUrl && !darkUrl) {
    return null
  }

  const render = (doc: typeof light, src: string, visibility: string) => (
    <Image
      alt=""
      className={`${visibility} w-auto object-contain ${className}`}
      height={doc?.height ?? 640}
      sizes={`${size * 2}px`}
      src={src}
      width={doc?.width ?? 960}
    />
  )

  // Decorative: the title right next to it already names the project.
  return (
    <>
      {lightUrl ? render(light, lightUrl, darkUrl ? 'dark:hidden' : '') : null}
      {darkUrl ? render(dark, darkUrl, lightUrl ? 'hidden dark:block' : '') : null}
    </>
  )
}
