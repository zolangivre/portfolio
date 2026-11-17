import { describe, expect, it } from 'vitest'

import { countConditions, MAX_ANONYMOUS_CONDITIONS } from '@/hooks/limitAnonymousQueries'

const over = MAX_ANONYMOUS_CONDITIONS + 1
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ 'category.slug': { equals: `x-${i}` } }))

describe('countConditions', () => {
  it('counts nothing without a where', () => {
    expect(countConditions(undefined)).toBe(0)
    expect(countConditions({})).toBe(0)
  })

  it('counts each field condition, through nested and / or', () => {
    expect(
      countConditions({
        and: [
          { slug: { equals: 'a' } },
          { or: [{ title: { like: 'b' } }, { year: { equals: 1 } }] },
        ],
      }),
    ).toBe(3)
  })

  // Payload matches `and` / `or` in any case: a spelling the count skipped
  // would let a whole list through as one condition.
  it.each(['OR', 'Or', 'AND', 'aNd'])('reads %s as Payload does', (key) => {
    expect(countConditions({ [key]: list(over) })).toBeGreaterThan(MAX_ANONYMOUS_CONDITIONS)
  })

  it('counts every operator under one field', () => {
    expect(countConditions({ slug: { equals: 'a', in: ['b'], like: 'c' } })).toBe(3)
  })

  it.each([
    ['an `or` that is not a list', { or: { slug: { equals: 'a' } } }],
    ['a where that is not an object', 'slug=a'],
    ['a nested item that is not an object', { or: ['slug'] }],
  ])('treats %s as over the limit', (_, where) => {
    expect(countConditions(where)).toBeGreaterThan(MAX_ANONYMOUS_CONDITIONS)
  })
})
