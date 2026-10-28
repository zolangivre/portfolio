/**
 * When the daily cron (vercel.json, 07:00 UTC) will run a scheduled publish:
 * the dashboard shows that rather than the date picked in the admin, which is
 * only a "not before".
 */

/** The hour (UTC) of the daily cron that runs scheduled publishes. */
const CRON_HOUR_UTC = 7

/**
 * The first run of the daily cron at or after `date`: a publish scheduled
 * for 06:30 UTC goes out at 07:00 the same day, one for 07:30 the next.
 */
export function nextCronRun(date: Date): Date {
  const run = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), CRON_HOUR_UTC),
  )

  if (run.getTime() < date.getTime()) {
    run.setUTCDate(run.getUTCDate() + 1)
  }

  return run
}
