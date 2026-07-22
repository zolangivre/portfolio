import { cache } from 'react'

import type { SectionsVisibility } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getSectionsVisibility = cache(
  async (locale: Locale = defaultLocale): Promise<SectionsVisibility | null> => {
    try {
      const payload = await getPayloadClient()

      return await payload.findGlobal({
        slug: 'sections-visibility',
        locale,
      })
    } catch (error) {
      console.error('Failed to load sections visibility from Payload.', error)

      return null
    }
  },
)
