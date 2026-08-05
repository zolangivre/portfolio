import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Footer } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchFooter = unstable_cache(
  async (locale: Locale): Promise<Footer> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'footer',
      locale,
    })
  },
  ['footer'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.footer] },
)

export const getFooter = cache(async (locale: Locale = defaultLocale): Promise<Footer | null> => {
  try {
    return await fetchFooter(locale)
  } catch (error) {
    console.error('Failed to load footer content from Payload.', error)

    return null
  }
})
