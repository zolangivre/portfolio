import { cache } from 'react'

import type { Education } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getEducation = cache(
  async (locale: Locale = defaultLocale): Promise<Education[]> => {
    try {
      const payload = await getPayloadClient()

      const education = await payload.find({
        collection: 'education',
        depth: 2,
        limit: 50,
        locale,
        sort: ['order', '-startDate'],
      })

      return education.docs
    } catch (error) {
      console.error('Failed to load education from Payload.', error)

      return []
    }
  },
)
