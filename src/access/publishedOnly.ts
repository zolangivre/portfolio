import type { Access } from 'payload'

/**
 * Anonymous readers (the REST/GraphQL API, anything unauthenticated) only ever
 * see published documents. Logged-in admins see drafts too, which is what makes
 * the preview flow work.
 *
 * IMPORTANT: this does not protect the front-end pages. `payload.find()` runs
 * with `overrideAccess: true` by default, which skips access control entirely,
 * and the Postgres adapter applies no implicit `_status` filter of its own.
 * Front-end queries must therefore filter on `_status` themselves — see
 * `publishedWhere` in src/lib/queries/status.ts.
 */
export const publishedOnly: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    _status: { equals: 'published' },
  }
}
