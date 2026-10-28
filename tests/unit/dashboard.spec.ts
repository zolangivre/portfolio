import { describe, expect, it } from 'vitest'

import { nextCronRun } from '@/lib/dashboard'

/**
 * The daily cron (vercel.json) runs at 07:00 UTC: a publication scheduled for
 * a given moment goes out at the first 07:00 UTC at or after it.
 */
const iso = (date: string) => nextCronRun(new Date(date)).toISOString()

describe('nextCronRun', () => {
  it('is the same day at 07:00 UTC before that time', () => {
    expect(iso('2026-10-28T05:30:00.000Z')).toBe('2026-10-28T07:00:00.000Z')
  })

  it('is the same day at 07:00 UTC from midnight', () => {
    expect(iso('2026-10-28T00:00:00.000Z')).toBe('2026-10-28T07:00:00.000Z')
  })

  it('keeps the very instant when it is exactly 07:00:00.000 UTC', () => {
    expect(iso('2026-10-28T07:00:00.000Z')).toBe('2026-10-28T07:00:00.000Z')
  })

  it('moves to the next day one second after 07:00 UTC', () => {
    expect(iso('2026-10-28T07:00:01.000Z')).toBe('2026-10-29T07:00:00.000Z')
  })

  it('moves to the next day one millisecond after 07:00 UTC', () => {
    expect(iso('2026-10-28T07:00:00.001Z')).toBe('2026-10-29T07:00:00.000Z')
  })

  it('moves to the next day in the evening', () => {
    expect(iso('2026-10-28T23:59:59.999Z')).toBe('2026-10-29T07:00:00.000Z')
  })

  it('rolls over the end of a month', () => {
    expect(iso('2026-01-31T12:00:00.000Z')).toBe('2026-02-01T07:00:00.000Z')
    expect(iso('2026-04-30T07:00:01.000Z')).toBe('2026-05-01T07:00:00.000Z')
  })

  it('rolls over the end of a year', () => {
    expect(iso('2026-12-31T23:59:59.000Z')).toBe('2027-01-01T07:00:00.000Z')
  })

  it('knows about leap days', () => {
    expect(iso('2028-02-28T08:00:00.000Z')).toBe('2028-02-29T07:00:00.000Z')
    expect(iso('2027-02-28T08:00:00.000Z')).toBe('2027-03-01T07:00:00.000Z')
  })

  it('reads the instant, not the local clock of the date', () => {
    // 08:30 in Paris (UTC+2) is 06:30 UTC: still before the cron that day.
    expect(iso('2026-10-28T08:30:00+02:00')).toBe('2026-10-28T07:00:00.000Z')
    // 01:00 in Paris on the 29th is 23:00 UTC on the 28th: next run is the 29th.
    expect(iso('2026-10-29T01:00:00+02:00')).toBe('2026-10-29T07:00:00.000Z')
  })

  it('does not change the date it is given', () => {
    const date = new Date('2026-10-28T12:00:00.000Z')

    nextCronRun(date)

    expect(date.toISOString()).toBe('2026-10-28T12:00:00.000Z')
  })
})
