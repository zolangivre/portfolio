/**
 * Sort comparator for the `_order` keys of `orderable` collections.
 *
 * The keys are fractional indexes, defined as ordered by code point. Payload
 * writes them in lowercase base 36, which Postgres' collation sorts the same
 * way; comparing code points keeps that guarantee without depending on the
 * alphabet or on a locale, as `localeCompare` would. A missing key (a
 * document saved before the collection was orderable) sorts last.
 */
export function compareOrderKeys(a?: string | null, b?: string | null): number {
  if (!a || !b) {
    return Number(!a) - Number(!b)
  }

  return a < b ? -1 : a > b ? 1 : 0
}
