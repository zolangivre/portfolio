import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Redirect } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { getPayloadClient } from '../payload'
import { redirectCandidates, redirectDestination } from '../redirects'

// The destination of a reference is the target's current slug and status, so
// renaming, unpublishing or trashing it has to bust this entry too.
const REDIRECT_TAGS = [cacheTags.redirects, cacheTags.projects, cacheTags.journal]

/**
 * Every redirect, in one cache entry. Looking a path up on its own cached it
 * per path, and the paths come from whoever asks: each unknown URL a bot
 * tried left one more entry. The list is a few dozen rows at most.
 */
const fetchRedirects = unstable_cache(
  async (): Promise<Redirect[]> => {
    const payload = await getPayloadClient()

    const { docs } = await payload.find({
      collection: 'redirects',
      depth: 1,
      overrideAccess: true,
      pagination: false,
      populate: {
        journal: { _status: true, slug: true },
        projects: { _status: true, slug: true },
      },
    })

    return docs
  },
  ['redirects:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: REDIRECT_TAGS },
)

/**
 * Where an old URL of the site now leads (lib/redirects.ts), or `null`. Read
 * only by pages about to answer 404. A database error counts as "no
 * redirect", and is not cached.
 */
export const getRedirectDestination = cache(async (path: string): Promise<string | null> => {
  try {
    const redirects = await fetchRedirects()

    // The exact path wins over its locale-less form.
    for (const candidate of redirectCandidates(path)) {
      const redirect = redirects.find((doc) => doc.from === candidate)
      const destination = redirect ? redirectDestination(redirect, path) : null
      if (destination) return destination
    }

    return null
  } catch (error) {
    console.error('Failed to look up a redirect in Payload.', error)

    return null
  }
})
