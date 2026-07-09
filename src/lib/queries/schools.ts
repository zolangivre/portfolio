import type { School } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getSchools(locale: Locale = defaultLocale): Promise<School[]> {
  try {
    const payload = await getPayloadClient()

    const schools = await payload.find({
      collection: 'schools',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return schools.docs
  } catch (error) {
    console.error('Failed to load schools from Payload.', error)

    return []
  }
}
