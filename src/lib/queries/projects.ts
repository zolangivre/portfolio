import type { Project } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 12

export async function getFeaturedProjects(locale: Locale = defaultLocale): Promise<Project[]> {
  try {
    const payload = await getPayloadClient()

    const projects = await payload.find({
      collection: 'projects',
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: ['-featured', 'order', '-year', '-createdAt'],
      where: {
        featured: {
          equals: true,
        },
      },
    })

    return projects.docs
  } catch (error) {
    console.error('Failed to load featured projects from Payload.', error)

    return []
  }
}

export async function getAllProjects(locale: Locale = defaultLocale): Promise<Project[]> {
  try {
    const payload = await getPayloadClient()

    const projects = await payload.find({
      collection: 'projects',
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: ['-featured', 'order', '-year', '-createdAt'],
    })

    return projects.docs
  } catch (error) {
    console.error('Failed to load projects from Payload.', error)

    return []
  }
}

export async function getProject(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<Project | null> {
  try {
    const payload = await getPayloadClient()

    const projects = await payload.find({
      collection: 'projects',
      depth: 2,
      limit: 1,
      locale,
      where: {
        slug: { equals: slug },
      },
    })

    return projects.docs[0] ?? null
  } catch (error) {
    console.error('Failed to load project from Payload.', error)

    return null
  }
}
