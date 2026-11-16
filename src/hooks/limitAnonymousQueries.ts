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

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The conditions in a `where`, through every `and` / `or`, counted the way
 * Payload reads them: it matches `and` / `or` in any case (`OR`, `And`), and
 * each operator under a field (`{ equals, in, like }`) is a condition of its
 * own. A shape Payload wouldn't read as a plain list of conditions counts as
 * over the limit rather than as one.
 */
export function countConditions(where: unknown): number {
  if (where === undefined) return 0
  if (!isPlainObject(where)) return Infinity

  let count = 0

  for (const [key, value] of Object.entries(where)) {
    const lower = key.toLowerCase()

    if (lower === 'and' || lower === 'or') {
      if (!Array.isArray(value)) return Infinity
      for (const nested of value) count += countConditions(nested)
    } else if (isPlainObject(value)) {
      count += Math.max(1, Object.keys(value).length)
    } else {
      count += 1
    }

    if (count > MAX_ANONYMOUS_CONDITIONS) return count
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
