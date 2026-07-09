import type { Technology } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getTechnologies(locale: Locale = defaultLocale): Promise<Technology[]> {
  try {
    const payload = await getPayloadClient()

    const technologies = await payload.find({
      collection: 'technologies',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return technologies.docs
  } catch (error) {
    console.error('Failed to load technologies from Payload.', error)

    return []
  }
}
