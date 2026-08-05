import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Project } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 12

// depth: 2 inlines the technologies (and their logos), the category and the
// cover images into the returned doc, so an edit on any of those has to bust
// this entry too — not just an edit on the project itself.
const PROJECT_TAGS = [
  cacheTags.projects,
  cacheTags.technologies,
  cacheTags.categories,
  cacheTags.media,
]

const fetchAllProjects = unstable_cache(
  async (locale: Locale): Promise<Project[]> => {
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
  },
  ['projects:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: PROJECT_TAGS },
)

const fetchProject = unstable_cache(
  async (slug: string, locale: Locale): Promise<Project | null> => {
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
  },
  ['projects:one'],
  { revalidate: FALLBACK_REVALIDATE, tags: PROJECT_TAGS },
)

// `cache()` dedupes within one render, `unstable_cache` caches across requests
// and carries the tags. The try/catch stays outside the cached function on
// purpose: a transient database error must not get stored as an empty result
// and served for a day.
export const getAllProjects = cache(async (locale: Locale = defaultLocale): Promise<Project[]> => {
  try {
    return await fetchAllProjects(locale)
  } catch (error) {
    console.error('Failed to load projects from Payload.', error)

    return []
  }
})

export const getProject = cache(
  async (slug: string, locale: Locale = defaultLocale): Promise<Project | null> => {
    try {
      return await fetchProject(slug, locale)
    } catch (error) {
      console.error('Failed to load project from Payload.', error)

      return null
    }
  },
)
