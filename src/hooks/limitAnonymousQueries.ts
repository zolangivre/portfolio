import { APIError, type CollectionBeforeOperationHook, type Where } from 'payload'

/**
 * Bounds what one anonymous REST read may ask of the database.
 *
 * The REST API is public, and Payload caps neither a query's `where` nor its
 * page size. Each condition on a relationship (`category.slug`) adds joins —
 * two per condition with the access rule's own — so a single request listing
 * thousands of them sent Neon one statement with thousands of joins. And
 * `?limit=1000000` or `?pagination=false` asked for every row at once.
 *
 * Only anonymous REST requests are bounded: the site's pages read through
 * the Local API, and editors and MCP keys are signed in.
 */

/** A visitor never needs more rows than the site shows in one list. */
export const MAX_ANONYMOUS_LIMIT = 100

/** Far above anything a filter on this site needs. */
export const MAX_ANONYMOUS_CONDITIONS = 20

type QueryArgs = { limit?: number; pagination?: boolean; where?: Where }

/** The field conditions in a `where`, through every `and` / `or`. */
export function countConditions(where: Where | undefined): number {
  if (!where || typeof where !== 'object') return 0

  let count = 0

  for (const [key, value] of Object.entries(where)) {
    if ((key === 'and' || key === 'or') && Array.isArray(value)) {
      for (const nested of value) count += countConditions(nested as Where)
    } else {
      count += 1
    }
  }

  return count
}

export const limitAnonymousQueries: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (req.payloadAPI !== 'REST' || req.user) return args
  if (operation !== 'read' && operation !== 'count') return args

  const query = args as QueryArgs

  if (countConditions(query.where) > MAX_ANONYMOUS_CONDITIONS) {
    throw new APIError(
      `Une requête anonyme accepte au plus ${MAX_ANONYMOUS_CONDITIONS} conditions.`,
      400,
    )
  }

  // `count` has no page, and a read by id has no limit to cap.
  if (operation === 'count' || query.limit === undefined) {
    return query.pagination === false ? ({ ...args, pagination: true } as typeof args) : args
  }

  const limit = query.limit > 0 ? Math.min(query.limit, MAX_ANONYMOUS_LIMIT) : MAX_ANONYMOUS_LIMIT

  return { ...args, limit, pagination: true } as typeof args
}
