import type { Access } from 'payload'

/**
 * Read access for the collections that carry a `visibility` field.
 *
 * The site's own queries already filter on `visibility: 'public'`, but those
 * only cover the pages — Payload's REST and GraphQL endpoints are open to
 * anyone and answer from the access rules alone. Returning a `Where` instead
 * of `true` pushes the same filter down to every read path at once, so a
 * private document can't be pulled from `/api/<collection>` either.
 *
 * Logged-in editors keep unrestricted read so the admin panel still lists
 * private documents. Server-side reads through the Local API are unaffected:
 * they run with `overrideAccess: true` by default.
 */
export const readPublicOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return { visibility: { equals: 'public' } }
}
