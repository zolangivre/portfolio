import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Education } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchEducation = unstable_cache(
  async (locale: Locale): Promise<Education[]> => {
    const payload = await getPayloadClient()

    const education = await payload.find({
      collection: 'education',
      depth: 2,
      limit: 50,
      locale,
      sort: ['order', '-startDate'],
    })

    return education.docs
  },
  ['education:all'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // depth: 2 inlines the school and its logo.
    tags: [cacheTags.education, cacheTags.schools, cacheTags.media],
  },
)

export const getEducation = cache(
  async (locale: Locale = defaultLocale): Promise<Education[]> => {
    try {
      return await fetchEducation(locale)
    } catch (error) {
      console.error('Failed to load education from Payload.', error)

      return []
    }
  },
)
