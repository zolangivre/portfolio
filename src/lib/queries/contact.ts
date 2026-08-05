import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Contact } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchContact = unstable_cache(
  async (locale: Locale): Promise<Contact> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'contact',
      locale,
    })
  },
  ['contact'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.contact] },
)

export const getContact = cache(async (locale: Locale = defaultLocale): Promise<Contact | null> => {
  try {
    return await fetchContact(locale)
  } catch (error) {
    console.error('Failed to load contact content from Payload.', error)

    return null
  }
})
