import type { Contact } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getContact(locale: Locale = defaultLocale): Promise<Contact | null> {
  try {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'contact',
      locale,
    })
  } catch (error) {
    console.error('Failed to load contact content from Payload.', error)

    return null
  }
}
