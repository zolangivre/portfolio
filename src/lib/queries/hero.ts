import { cache } from 'react'

import type { Hero } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getHero = cache(async (locale: Locale = defaultLocale): Promise<Hero | null> => {
  try {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'hero',
      locale,
    })
  } catch (error) {
    console.error('Failed to load hero content from Payload.', error)

    return null
  }
})
