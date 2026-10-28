import { timingSafeEqual } from 'node:crypto'

import type { Access, PayloadRequest } from 'payload'

/**
 * Read access for the collections with drafts.
 *
 * The site's own queries already filter on `_status: 'published'`, but those
 * only cover the pages — Payload's REST and GraphQL endpoints are open to
 * anyone and answer from the access rules alone. Returning a `Where` instead
 * of `true` pushes the same filter down to every read path at once, so a
 * draft can't be pulled from `/api/<collection>` either.
 *
 * Logged-in editors keep unrestricted read so the admin panel still lists
 * drafts. Server-side reads through the Local API are unaffected: they run
 * with `overrideAccess: true` by default.
 */
export const readPublishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return { _status: { equals: 'published' } }
}

/**
 * readPublishedOrAuthenticated for the collections with drafts, which also
 * have a trash: a visitor reads what is published and not in the trash. The
 * globals keep the plain rule — they have no trash, and a filter on
 * `deletedAt` would match nothing there.
 */
export const readPublishedUntrashedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return { _status: { equals: 'published' }, deletedAt: { exists: false } }
}

/**
 * Read access for the public collections without drafts (taxonomies,
 * companies, schools, testimonials): everything, except what is in the trash.
 *
 * `?trash=true` on a REST or GraphQL read only drops Payload's own "not
 * trashed" filter — it doesn't ask who is reading. Without this, anyone could
 * list what an editor put in the trash. Editors keep it all, for the admin's
 * trash view.
 */
export const readUntrashedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return { deletedAt: { exists: false } }
}

/**
 * Who may run the job queue through `/api/payload-jobs/run`, which is what
 * publishes the documents scheduled in the admin.
 *
 * Vercel's cron calls it once a day with `Authorization: Bearer
 * <CRON_SECRET>`; an editor can also trigger it while logged in. Without
 * `CRON_SECRET` set, only an editor gets through — never an anonymous caller.
 */
export const canRunJobs = ({ req }: { req: PayloadRequest }): boolean => {
  if (req.user) return true

  const secret = process.env.CRON_SECRET
  const header = req.headers.get('authorization')
  if (!secret || !header) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)

  return expected.length === received.length && timingSafeEqual(expected, received)
}
