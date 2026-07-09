import type { About } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getAbout(locale: Locale = defaultLocale): Promise<About | null> {
  try {
    const payload = await getPayloadClient()

    return await payload.findGlobal({
      slug: 'about',
      locale,
    })
  } catch (error) {
    console.error('Failed to load about content from Payload.', error)

    return null
  }
}
