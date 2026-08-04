import type { Media } from '@/payload-types'

export const getMediaUrl = (media: Media | number | null | undefined): string | null => {
  if (!media || typeof media === 'number') {
    return null
  }

  return media.url ?? null
}

/**
 * Builds a srcset from the derivatives Payload actually generated.
 *
 * Reading `media.sizes` rather than deriving URLs by string manipulation means
 * we can never point at a file that doesn't exist: Payload writes null for any
 * size larger than the original (see the `imageSizes` note in
 * src/collections/Media.ts), and those entries are skipped here.
 *
 * Returns undefined when there's nothing useful to offer — a single candidate
 * is not a srcset, it's just the src — so callers can omit the attribute
 * entirely. That also makes this safe before the existing media is backfilled:
 * no derivatives yet simply means the original is served, exactly as today.
 */
export const getMediaSrcSet = (media: Media | number | null | undefined): string | undefined => {
  if (!media || typeof media === 'number') {
    return undefined
  }

  const candidates: { url: string; width: number }[] = []

  for (const size of Object.values(media.sizes ?? {})) {
    if (size?.url && size.width) {
      candidates.push({ url: size.url, width: size.width })
    }
  }

  if (media.url && media.width) {
    candidates.push({ url: media.url, width: media.width })
  }

  if (candidates.length < 2) {
    return undefined
  }

  // Sort ascending and drop duplicate widths — a repeated descriptor makes the
  // whole srcset invalid in some browsers.
  const byWidth = new Map<number, string>()
  for (const { url, width } of candidates.sort((a, b) => a.width - b.width)) {
    byWidth.set(width, url)
  }

  return [...byWidth.entries()].map(([width, url]) => `${url} ${width}w`).join(', ')
}

/** Convenience for the common "render this Media doc" case. */
export const getMediaImageProps = (media: Media | number | null | undefined) => ({
  src: getMediaUrl(media),
  srcSet: getMediaSrcSet(media),
})
