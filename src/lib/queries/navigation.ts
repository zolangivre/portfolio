import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Navigation } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchNavigation = unstable_cache(
  async (locale: Locale): Promise<Navigation> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'navigation',
      locale,
    })
  },
  ['navigation'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.navigation] },
)

export const getNavigation = cache(
  async (locale: Locale = defaultLocale): Promise<Navigation | null> => {
    try {
      return await fetchNavigation(locale)
    } catch (error) {
      console.error('Failed to load navigation from Payload.', error)

      return null
    }
  },
)
