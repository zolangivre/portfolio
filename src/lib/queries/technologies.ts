import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Technology } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchTechnologies = unstable_cache(
  async (locale: Locale): Promise<Technology[]> => {
    const payload = await getPayloadClient()

    const technologies = await payload.find({
      collection: 'technologies',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return technologies.docs
  },
  ['technologies:all'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // depth: 1 inlines the logo and the category.
    tags: [cacheTags.technologies, cacheTags.categories, cacheTags.media],
  },
)

export const getTechnologies = cache(
  async (locale: Locale = defaultLocale): Promise<Technology[]> => {
    try {
      return await fetchTechnologies(locale)
    } catch (error) {
      console.error('Failed to load technologies from Payload.', error)

      return []
    }
  },
)
