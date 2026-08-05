import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Company } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchCompanies = unstable_cache(
  async (locale: Locale): Promise<Company[]> => {
    const payload = await getPayloadClient()

    const companies = await payload.find({
      collection: 'companies',
      depth: 1,
      limit: 100,
      locale,
      sort: 'name',
    })

    return companies.docs
  },
  ['companies:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.companies, cacheTags.media] },
)

export const getCompanies = cache(async (locale: Locale = defaultLocale): Promise<Company[]> => {
  try {
    return await fetchCompanies(locale)
  } catch (error) {
    console.error('Failed to load companies from Payload.', error)

    return []
  }
})
