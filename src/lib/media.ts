import type { Media, Video } from '@/payload-types'

/**
 * Either kind of upload once resolved to a document. `media` and `videos` are
 * separate collections only because they need different upload transports
 * (see collections/Videos.ts) — everything downstream treats them alike, and
 * both carry the url/alt/mimeType/width/height this module reads.
 */
export type MediaDoc = Media | Video

/**
 * A polymorphic `['media', 'videos']` relation as Payload stores it. The value
 * is the document at depth >= 1 and a bare id when the query didn't populate
 * it, which is why every read goes through `asMediaDoc`.
 */
export type MediaRelation =
  | { relationTo: 'media'; value: Media | number }
  | { relationTo: 'videos'; value: Video | number }
  | null
  | undefined

export const isVideo = (mimeType: string | null | undefined): boolean =>
  Boolean(mimeType?.startsWith('video/'))

/** The document behind a polymorphic relation, or null if it wasn't resolved. */
export const asMediaDoc = (relation: MediaRelation): MediaDoc | null => {
  const value = relation?.value

  return value && typeof value === 'object' ? value : null
}

/**
 * Videos are uploaded straight from the browser to R2, which skips the
 * `withUniqueSuffix` hook that gives every image a one-off filename. Payload
 * still refuses a name a live doc already holds, but deleting a video and
 * re-uploading one called the same thing lands on the identical R2 key — and
 * Cloudflare's edge, plus any browser that cached it, keeps serving the old
 * bytes. Stamping the url with `updatedAt` makes each saved version its own
 * cache entry. It also busts on an edit that didn't touch the file (renaming
 * the alt text, say), which costs one origin fetch and nothing else.
 */
const withCacheKey = (url: string, media: MediaDoc): string => {
  if (!isVideo(media.mimeType) || !media.updatedAt) {
    return url
  }

  const version = Date.parse(media.updatedAt)

  return Number.isNaN(version) ? url : `${url}?v=${version}`
}

export const getMediaUrl = (media: MediaDoc | number | null | undefined): string | null => {
  if (!media || typeof media === 'number') {
    return null
  }

  return media.url ? withCacheKey(media.url, media) : null
}

/** The url behind a polymorphic relation — `asMediaDoc` then `getMediaUrl`. */
export const getRelationUrl = (relation: MediaRelation): string | null =>
  getMediaUrl(asMediaDoc(relation))
