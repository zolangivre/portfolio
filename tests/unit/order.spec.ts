import { describe, expect, it } from 'vitest'

import { compareOrderKeys } from '@/lib/order'

/**
 * Signature under test: `compareOrderKeys(a?: string | null, b?: string | null): number`
 * — a sort comparator over fractional-index keys. Keys compare by code point
 * (their order is the ASCII order); a missing key sorts last.
 */
describe('compareOrderKeys', () => {
  it('puts the smaller key first', () => {
    expect(compareOrderKeys('a0', 'a1')).toBeLessThan(0)
    expect(compareOrderKeys('a1', 'a0')).toBeGreaterThan(0)
  })

  it('returns 0 for equal keys', () => {
    expect(compareOrderKeys('a0', 'a0')).toBe(0)
  })

  // localeCompare would put "a1" before "Zz" (case-insensitive-ish collation);
  // fractional keys are ordered by ASCII, where uppercase comes first.
  it('compares by code point, not by locale', () => {
    expect(compareOrderKeys('Zz', 'a1')).toBeLessThan(0)
    expect(compareOrderKeys('a1', 'Zz')).toBeGreaterThan(0)
    expect(compareOrderKeys('a0V', 'a0a')).toBeLessThan(0)
  })

  it('treats a longer key with the same prefix as greater', () => {
    expect(compareOrderKeys('a0', 'a0V')).toBeLessThan(0)
  })

  it('sorts a missing key after any key', () => {
    expect(compareOrderKeys(null, 'a0')).toBeGreaterThan(0)
    expect(compareOrderKeys('a0', null)).toBeLessThan(0)
    expect(compareOrderKeys(undefined, 'a0')).toBeGreaterThan(0)
    expect(compareOrderKeys('a0', undefined)).toBeLessThan(0)
    expect(compareOrderKeys('', 'a0')).toBeGreaterThan(0)
    expect(compareOrderKeys('a0', '')).toBeLessThan(0)
  })

  it('considers two missing keys equal', () => {
    expect(compareOrderKeys(null, undefined)).toBe(0)
    expect(compareOrderKeys('', null)).toBe(0)
    expect(compareOrderKeys()).toBe(0)
  })

  it('works as an Array.sort comparator', () => {
    // No `undefined` here: Array.prototype.sort moves it to the end without
    // calling the comparator, so it would prove nothing about this function.
    const keys = ['a1', null, 'Zz', 'a0', 'a0V', '']

    expect([...keys].sort(compareOrderKeys)).toEqual(['Zz', 'a0', 'a0V', 'a1', null, ''])
  })
})
