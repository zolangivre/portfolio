import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Hero } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchHero = unstable_cache(
  async (locale: Locale): Promise<Hero> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'hero',
      locale,
    })
  },
  ['hero'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.hero, cacheTags.media] },
)

export const getHero = cache(async (locale: Locale = defaultLocale): Promise<Hero | null> => {
  try {
    return await fetchHero(locale)
  } catch (error) {
    console.error('Failed to load hero content from Payload.', error)

    return null
  }
})
