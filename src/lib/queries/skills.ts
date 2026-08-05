import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Skill } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchSkills = unstable_cache(
  async (locale: Locale): Promise<Skill[]> => {
    const payload = await getPayloadClient()

    const skills = await payload.find({
      collection: 'skills',
      depth: 1,
      limit: 100,
      locale,
      sort: ['category', 'name'],
    })

    return skills.docs
  },
  ['skills:all'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // depth: 1 inlines the category and the icon.
    tags: [cacheTags.skills, cacheTags.categories, cacheTags.media],
  },
)

export const getSkills = cache(async (locale: Locale = defaultLocale): Promise<Skill[]> => {
  try {
    return await fetchSkills(locale)
  } catch (error) {
    console.error('Failed to load skills from Payload.', error)

    return []
  }
})
