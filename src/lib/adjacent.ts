/**
 * Returns the entries that sit around `slug` in an already-ordered list.
 *
 * The list has to come from the same query the index page uses, so the
 * previous/next links follow the order a visitor actually saw.
 */
export function getAdjacentBySlug<T extends { slug: string }>(
  items: T[],
  slug: string,
): { previous: T | null; next: T | null } {
  const index = items.findIndex((item) => item.slug === slug)

  if (index === -1) {
    return { previous: null, next: null }
  }

  return {
    previous: items[index - 1] ?? null,
    next: items[index + 1] ?? null,
  }
}
