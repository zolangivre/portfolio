import { cache } from 'react'

import type { Experience } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 12

export const getExperiences = cache(
  async (locale: Locale = defaultLocale): Promise<Experience[]> => {
    try {
      const payload = await getPayloadClient()

      const experiences = await payload.find({
        collection: 'experiences',
        depth: 2,
        limit: DEFAULT_LIMIT,
        locale,
        sort: ['order', '-startDate'],
      })

      return experiences.docs
    } catch (error) {
      console.error('Failed to load experiences from Payload.', error)

      return []
    }
  },
)
