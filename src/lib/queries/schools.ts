import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { School } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchSchools = unstable_cache(
  async (locale: Locale): Promise<School[]> => {
    const payload = await getPayloadClient()

    const schools = await payload.find({
      collection: 'schools',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return schools.docs
  },
  ['schools:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.schools, cacheTags.media] },
)

export const getSchools = cache(async (locale: Locale = defaultLocale): Promise<School[]> => {
  try {
    return await fetchSchools(locale)
  } catch (error) {
    console.error('Failed to load schools from Payload.', error)

    return []
  }
})
