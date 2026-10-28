import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { getPayloadClient } from '../payload'
import { redirectCandidates, redirectDestination } from '../redirects'

// The destination of a reference is the target's current slug and status, so
// renaming, unpublishing or trashing it has to bust this entry too.
const REDIRECT_TAGS = [cacheTags.redirects, cacheTags.projects, cacheTags.journal]

const fetchRedirectDestination = unstable_cache(
  async (path: string): Promise<string | null> => {
    const payload = await getPayloadClient()
    const candidates = redirectCandidates(path)

    const { docs } = await payload.find({
      collection: 'redirects',
      depth: 1,
      limit: candidates.length,
      overrideAccess: true,
      populate: {
        journal: { _status: true, slug: true },
        projects: { _status: true, slug: true },
      },
      where: { from: { in: candidates } },
    })

    // The exact path wins over its locale-less form.
    for (const candidate of candidates) {
      const redirect = docs.find((doc) => doc.from === candidate)
      const destination = redirect ? redirectDestination(redirect, path) : null
      if (destination) return destination
    }

    return null
  },
  ['redirects:destination'],
  { revalidate: FALLBACK_REVALIDATE, tags: REDIRECT_TAGS },
)

/**
 * Where an old URL of the site now leads (lib/redirects.ts), or `null`. Read
 * only by pages about to answer 404. A database error counts as "no
 * redirect", and is not cached.
 */
export const getRedirectDestination = cache(async (path: string): Promise<string | null> => {
  try {
    return await fetchRedirectDestination(path)
  } catch (error) {
    console.error('Failed to look up a redirect in Payload.', error)

    return null
  }
})
