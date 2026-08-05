import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { SectionsVisibility } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchSectionsVisibility = unstable_cache(
  async (locale: Locale): Promise<SectionsVisibility> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'sections-visibility',
      locale,
    })
  },
  ['sections-visibility'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.sectionsVisibility] },
)

export const getSectionsVisibility = cache(
  async (locale: Locale = defaultLocale): Promise<SectionsVisibility | null> => {
    try {
      return await fetchSectionsVisibility(locale)
    } catch (error) {
      console.error('Failed to load sections visibility from Payload.', error)

      return null
    }
  },
)
