import { notFound } from 'next/navigation'

/**
 * Catch-all for URLs that match no route under a locale (`/fr/whatever`,
 * and `/fr/projects` since the archive was removed).
 *
 * `[locale]/not-found.tsx` only renders when a page calls `notFound()`. An
 * unmatched URL never reaches a page, and with two root layouts (frontend and
 * Payload admin) there's no app-wide `not-found` for Next to fall back on, so
 * it served its own bare default 404. Routing those URLs here and calling
 * `notFound()` renders the site's 404 inside the locale layout instead — same
 * header, footer and theme, still with a 404 status.
 */
export default function CatchAllNotFound() {
  notFound()
}
