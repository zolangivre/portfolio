import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Hero } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { isPreview } from '../preview'

const fetchHero = unstable_cache(
  async (locale: Locale, draft: boolean): Promise<Hero> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      draft,
      slug: 'hero',
      locale,
    })
  },
  ['hero'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.hero, cacheTags.media] },
)

export const getHero = cache(async (locale: Locale = defaultLocale): Promise<Hero | null> => {
  try {
    return await fetchHero(locale, await isPreview())
  } catch (error) {
    console.error('Failed to load hero content from Payload.', error)

    return null
  }
})
