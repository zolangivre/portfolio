import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { About } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchAbout = unstable_cache(
  async (locale: Locale): Promise<About> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'about',
      locale,
    })
  },
  ['about'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.about, cacheTags.media] },
)

export const getAbout = cache(async (locale: Locale = defaultLocale): Promise<About | null> => {
  try {
    return await fetchAbout(locale)
  } catch (error) {
    console.error('Failed to load about content from Payload.', error)

    return null
  }
})
