import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { SectionsContent } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchSectionsContent = unstable_cache(
  async (locale: Locale): Promise<SectionsContent> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'sections-content',
      locale,
    })
  },
  ['sections-content'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.sectionsContent] },
)

export const getSectionsContent = cache(
  async (locale: Locale = defaultLocale): Promise<SectionsContent | null> => {
    try {
      return await fetchSectionsContent(locale)
    } catch (error) {
      console.error('Failed to load sections content from Payload.', error)

      return null
    }
  },
)
