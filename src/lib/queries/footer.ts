import { cache } from 'react'

import type { Footer } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getFooter = cache(async (locale: Locale = defaultLocale): Promise<Footer | null> => {
  try {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'footer',
      locale,
    })
  } catch (error) {
    console.error('Failed to load footer content from Payload.', error)

    return null
  }
})
