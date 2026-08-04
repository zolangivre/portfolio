import { cache } from 'react'

import { getPayloadClient } from '../payload'

type RedirectTarget = {
  /** Destination path or absolute URL. */
  destination: string
  /** HTTP status to use. Payload stores it as a string ('301', '302', …). */
  permanent: boolean
}

/**
 * Looks up a redirect for a path that would otherwise 404.
 *
 * Deliberately called from the page's not-found branch rather than from
 * middleware: middleware would add a database round trip to *every* request,
 * while this only runs when a URL genuinely misses. The trade-off is that
 * redirects apply to the routes that call this helper (project and journal
 * detail pages — where slugs actually change), not to arbitrary paths.
 */
export const getRedirect = cache(async (from: string): Promise<RedirectTarget | null> => {
  try {
    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'redirects',
      depth: 1,
      limit: 1,
      where: { from: { equals: from } },
    })

    const doc = result.docs[0]

    if (!doc?.to) {
      return null
    }

    // Only 301 and 302 are offered in the admin (see redirectsPlugin config).
    const permanent = doc.type === '301'

    if (doc.to.type === 'custom' && doc.to.url) {
      return { destination: doc.to.url, permanent }
    }

    // Internal reference: rebuild the path from the related document's slug.
    const reference = doc.to.reference

    if (reference && typeof reference.value === 'object' && reference.value) {
      const slug = (reference.value as { slug?: string }).slug

      if (slug) {
        const segment = reference.relationTo === 'journal' ? 'journal' : 'projects'
        // `from` starts with the locale (/fr/projects/old-slug), so reuse it to
        // keep the visitor in the language they arrived in.
        const locale = from.split('/')[1] || 'fr'

        return { destination: `/${locale}/${segment}/${slug}`, permanent }
      }
    }

    return null
  } catch (error) {
    console.error('Failed to look up redirect from Payload.', error)

    return null
  }
})
