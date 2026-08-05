import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Setting } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchGlobalSettings = unstable_cache(
  async (locale: Locale): Promise<Setting> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'settings',
      locale,
    })
  },
  ['settings'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // The photo and the SEO default image are media uploads.
    tags: [cacheTags.settings, cacheTags.media],
  },
)

export const getGlobalSettings = cache(
  async (locale: Locale = defaultLocale): Promise<Setting | null> => {
    try {
      return await fetchGlobalSettings(locale)
    } catch (error) {
      console.error('Failed to load global settings from Payload.', error)

      return null
    }
  },
)
