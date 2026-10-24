import type { Locale } from './locale'

/**
 * The span of a timeline entry — "avr. 2025 – aujourd’hui" — or a single
 * month when it starts and ends in the same one, rather than
 * "juin 2024 – juin 2024".
 *
 * Read in UTC, like the journal dates: Payload stores a day-only date at
 * noon UTC, so every server prints the same month whatever its own time
 * zone (Vercel's is UTC, a laptop's usually isn't).
 */
export function formatMonthRange(
  start: string,
  end: string | null | undefined,
  locale: Locale,
  present: string,
): string {
  const format = new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  })
  const from = format.format(new Date(start))

  if (!end) {
    return `${from} – ${present}`
  }

  const to = format.format(new Date(end))

  return from === to ? from : `${from} – ${to}`
}
