import { notFound, permanentRedirect } from 'next/navigation'

import { getRedirectDestination } from '@/lib/queries'

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
 *
 * Before that, an old URL that has a redirect sends the visitor on.
 */
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>
}) {
  const { locale, rest } = await params
  const destination = await getRedirectDestination(`/${locale}/${rest.join('/')}`)

  if (destination) permanentRedirect(destination)

  notFound()
}
