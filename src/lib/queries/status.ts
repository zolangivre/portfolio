import type { Where } from 'payload'

/**
 * Every public-facing query must carry this.
 *
 * The front-end uses the Local API, which defaults to `overrideAccess: true`
 * and therefore ignores collection access control. The Postgres adapter also
 * ignores the `draft` flag when building its query — it only filters by
 * `_status` if you ask it to. So without this clause, unpublished drafts render
 * on the live site.
 */
export const publishedWhere: Where = {
  _status: { equals: 'published' },
}

/**
 * In draft mode (Payload's preview button / Live Preview) we want the newest
 * content whatever its status, so the status filter is dropped entirely.
 */
export function statusWhere(draft: boolean): Where {
  return draft ? {} : publishedWhere
}
