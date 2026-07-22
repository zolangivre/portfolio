import { cache } from 'react'

import type { Navigation } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getNavigation = cache(
  async (locale: Locale = defaultLocale): Promise<Navigation | null> => {
    try {
      const payload = await getPayloadClient()

      return await payload.findGlobal({
        slug: 'navigation',
        locale,
      })
    } catch (error) {
      console.error('Failed to load navigation from Payload.', error)

      return null
    }
  },
)
