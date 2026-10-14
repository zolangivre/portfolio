import sharp from 'sharp'

/** Longest edge of the preview, in px: enough for colours and shapes, nothing more. */
const PREVIEW_SIZE = 16

/** What can be shrunk into a preview: raster images (not SVG, not PDF). */
export function canHavePlaceholder(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith('image/')) && mimeType !== 'image/svg+xml'
}

/**
 * A tiny blurred preview of an image, as a data URL of a few hundred bytes:
 * shown the instant a photo's box appears and replaced by the real image
 * once it has loaded (next/image `placeholder="blur"`), so a photo comes
 * into focus rather than popping into an empty box. Null if the file can't
 * be read — a missing preview just means the old plain fade.
 */
export async function makePlaceholder(input: Buffer): Promise<string | null> {
  try {
    const preview = await sharp(input)
      .rotate()
      .resize(PREVIEW_SIZE, PREVIEW_SIZE, { fit: 'inside' })
      .webp({ quality: 50 })
      .toBuffer()

    return `data:image/webp;base64,${preview.toString('base64')}`
  } catch {
    return null
  }
}
