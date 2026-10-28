import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Contact } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { isPreview } from '../preview'

const fetchContact = unstable_cache(
  async (locale: Locale, draft: boolean): Promise<Contact> => {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      draft,
      slug: 'contact',
      locale,
    })
  },
  ['contact'],
  { revalidate: FALLBACK_REVALIDATE, tags: [cacheTags.contact] },
)

export const getContact = cache(async (locale: Locale = defaultLocale): Promise<Contact | null> => {
  try {
    return await fetchContact(locale, await isPreview())
  } catch (error) {
    console.error('Failed to load contact content from Payload.', error)

    return null
  }
})
