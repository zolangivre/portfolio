import { cache } from 'react'

import type { Setting } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getGlobalSettings = cache(
  async (locale: Locale = defaultLocale): Promise<Setting | null> => {
    try {
      const payload = await getPayloadClient()

      return await payload.findGlobal({
        slug: 'settings',
        locale,
      })
    } catch (error) {
      console.error('Failed to load global settings from Payload.', error)

      return null
    }
  },
)
