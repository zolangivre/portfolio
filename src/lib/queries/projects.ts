import { cache } from 'react'

import type { Project } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 12

export const getAllProjects = cache(async (locale: Locale = defaultLocale): Promise<Project[]> => {
  try {
    const payload = await getPayloadClient()

    const projects = await payload.find({
      collection: 'projects',
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: ['-featured', 'order', '-year', '-createdAt'],
      where: {
        visibility: { equals: 'public' },
      },
    })

    return projects.docs
  } catch (error) {
    console.error('Failed to load projects from Payload.', error)

    return []
  }
})

export const getProject = cache(
  async (slug: string, locale: Locale = defaultLocale): Promise<Project | null> => {
    try {
      const payload = await getPayloadClient()

      const projects = await payload.find({
        collection: 'projects',
        depth: 2,
        limit: 1,
        locale,
        where: {
          slug: { equals: slug },
          visibility: { equals: 'public' },
        },
      })

      return projects.docs[0] ?? null
    } catch (error) {
      console.error('Failed to load project from Payload.', error)

      return null
    }
  },
)
