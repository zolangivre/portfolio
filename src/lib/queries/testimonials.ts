import { cache } from 'react'

import type { Testimonial } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

export const getTestimonials = cache(
  async (locale: Locale = defaultLocale): Promise<Testimonial[]> => {
    try {
      const payload = await getPayloadClient()

      const testimonials = await payload.find({
        collection: 'testimonials',
        depth: 2,
        limit: 20,
        locale,
        sort: ['-featured', '-order', '-createdAt'],
      })

      return testimonials.docs
    } catch (error) {
      console.error('Failed to load testimonials from Payload.', error)

      return []
    }
  },
)
