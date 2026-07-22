import { cache } from 'react'

import type { SectionsContent } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getSectionsContent = cache(
  async (locale: Locale = defaultLocale): Promise<SectionsContent | null> => {
    try {
      const payload = await getPayloadClient()

      return await payload.findGlobal({
        slug: 'sections-content',
        locale,
      })
    } catch (error) {
      console.error('Failed to load sections content from Payload.', error)

      return null
    }
  },
)
