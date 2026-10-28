import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Experience } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { isPreview } from '../preview'

const DEFAULT_LIMIT = 12

const fetchExperiences = unstable_cache(
  async (locale: Locale, draft: boolean): Promise<Experience[]> => {
    const payload = await getPayloadClient()

    const experiences = await payload.find({
      collection: 'experiences',
      draft,
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: '_order',
      where: draft ? {} : { _status: { equals: 'published' } },
    })

    return experiences.docs
  },
  ['experiences:all'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // depth: 2 inlines the company (and its logo) and the technologies.
    tags: [cacheTags.experiences, cacheTags.companies, cacheTags.technologies, cacheTags.media],
  },
)

export const getExperiences = cache(
  async (locale: Locale = defaultLocale): Promise<Experience[]> => {
    try {
      return await fetchExperiences(locale, await isPreview())
    } catch (error) {
      console.error('Failed to load experiences from Payload.', error)

      return []
    }
  },
)
