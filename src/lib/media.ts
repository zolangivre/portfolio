import type { Media } from '@/payload-types'

export const getMediaUrl = (media: Media | number | null | undefined): string | null => {
  if (!media || typeof media === 'number') {
    return null
  }

  return media.url ?? null
}
