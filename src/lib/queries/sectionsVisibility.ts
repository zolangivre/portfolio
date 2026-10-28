import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { SectionsVisibility } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { isPreview } from '../preview'

const fetchSectionsVisibility = unstable_cache(
  async (locale: Locale, draft: boolean): Promise<SectionsVisibility> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      draft,
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
      return await fetchSectionsVisibility(locale, await isPreview())
    } catch (error) {
      console.error('Failed to load sections visibility from Payload.', error)

      return null
    }
  },
)
