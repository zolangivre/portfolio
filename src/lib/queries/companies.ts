import type { Company } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getCompanies(locale: Locale = defaultLocale): Promise<Company[]> {
  try {
    const payload = await getPayloadClient()

    const companies = await payload.find({
      collection: 'companies',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return companies.docs
  } catch (error) {
    console.error('Failed to load companies from Payload.', error)

    return []
  }
}
