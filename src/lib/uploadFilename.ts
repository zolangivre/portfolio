/**
 * Appends a short, sortable, collision-resistant suffix to an uploaded
 * filename so every upload lands on a brand-new R2 key — and therefore a
 * brand-new public URL.
 *
 * Without this, re-uploading `avatar.png` after deleting the old one reuses
 * the exact same URL, and Cloudflare's edge (plus every browser that already
 * cached it) keeps serving the previous bytes. Payload's built-in dedupe only
 * kicks in while the older doc still exists, so it doesn't cover the
 * delete-then-reupload case at all.
 *
 * Suffix = base36 timestamp (sortable, readable-ish) + 4 random chars, which
 * covers two files uploaded in the same millisecond during a bulk upload.
 */
export const withUniqueSuffix = (filename: string): string => {
  const dot = filename.lastIndexOf('.')
  // Leading-dot names (".gitignore") have no extension to preserve.
  const hasExt = dot > 0
  const base = hasExt ? filename.slice(0, dot) : filename
  const ext = hasExt ? filename.slice(dot) : ''

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

  return `${base}-${suffix}${ext}`
}
