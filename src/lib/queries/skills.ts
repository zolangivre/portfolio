import type { Skill } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export async function getSkills(locale: Locale = defaultLocale): Promise<Skill[]> {
  try {
    const payload = await getPayloadClient()

    const skills = await payload.find({
      collection: 'skills',
      depth: 1,
      limit: 100,
      locale,
      sort: ['category', 'name'],
    })

    return skills.docs
  } catch (error) {
    console.error('Failed to load skills from Payload.', error)

    return []
  }
}
