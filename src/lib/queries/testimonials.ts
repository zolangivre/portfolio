import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Testimonial } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const fetchTestimonials = unstable_cache(
  async (locale: Locale): Promise<Testimonial[]> => {
    const payload = await getPayloadClient()

    const testimonials = await payload.find({
      collection: 'testimonials',
      depth: 2,
      limit: 20,
      locale,
      sort: ['-featured', '-order', '-createdAt'],
    })

    return testimonials.docs
  },
  ['testimonials:all'],
  {
    revalidate: FALLBACK_REVALIDATE,
    // depth: 2 inlines the company (and its logo) and the author avatar.
    tags: [cacheTags.testimonials, cacheTags.companies, cacheTags.media],
  },
)

export const getTestimonials = cache(
  async (locale: Locale = defaultLocale): Promise<Testimonial[]> => {
    try {
      return await fetchTestimonials(locale)
    } catch (error) {
      console.error('Failed to load testimonials from Payload.', error)

      return []
    }
  },
)
