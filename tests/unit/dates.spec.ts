import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatMonthRange } from '@/lib/dates'

// How Payload stores a day-only date: noon UTC.
const april2025 = '2025-04-01T12:00:00.000Z'
const august2025 = '2025-08-01T12:00:00.000Z'
const june2024Start = '2024-06-01T12:00:00.000Z'
const june2024End = '2024-06-30T12:00:00.000Z'

describe('formatMonthRange', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('spans two months, in the page locale', () => {
    expect(formatMonthRange(april2025, august2025, 'fr', 'aujourd’hui')).toBe(
      'avr. 2025 – août 2025',
    )
    expect(formatMonthRange(april2025, august2025, 'en', 'Present')).toBe('Apr 2025 – Aug 2025')
  })

  it('ends on the "present" label when there is no end date', () => {
    expect(formatMonthRange(april2025, null, 'fr', 'aujourd’hui')).toBe('avr. 2025 – aujourd’hui')
    expect(formatMonthRange(april2025, undefined, 'en', 'Present')).toBe('Apr 2025 – Present')
  })

  it('shows a single month when it starts and ends in it', () => {
    expect(formatMonthRange(june2024Start, june2024End, 'fr', 'aujourd’hui')).toBe('juin 2024')
  })

  it('prints the same month whatever the server time zone', () => {
    // A day-only date near midnight UTC would move a month in a zone far
    // enough from UTC if it were read locally.
    const lastOfMonth = '2025-08-31T12:00:00.000Z'

    for (const zone of ['Pacific/Kiritimati', 'America/Los_Angeles', 'UTC']) {
      vi.stubEnv('TZ', zone)
      expect(formatMonthRange(lastOfMonth, null, 'en', 'Present')).toBe('Aug 2025 – Present')
    }
  })
})
