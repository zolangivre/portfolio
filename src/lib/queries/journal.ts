import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Journal } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { isPreview } from '../preview'

const DEFAULT_LIMIT = 100

// depth: 2 inlines the category and the cover/gallery images.
const JOURNAL_TAGS = [cacheTags.journal, cacheTags.categories, cacheTags.media]

const fetchJournalEntries = unstable_cache(
  async (locale: Locale, draft: boolean, category?: string): Promise<Journal[]> => {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      draft,
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: '_order',
      where: {
        ...(draft ? {} : { _status: { equals: 'published' as const } }),
        ...(category ? { category: { equals: category } } : {}),
      },
    })

    return entries.docs
  },
  ['journal:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: JOURNAL_TAGS },
)

const fetchJournalEntry = unstable_cache(
  async (slug: string, locale: Locale, draft: boolean): Promise<Journal | null> => {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      draft,
      depth: 2,
      limit: 1,
      locale,
      where: {
        slug: { equals: slug },
        ...(draft ? {} : { _status: { equals: 'published' as const } }),
      },
    })

    return entries.docs[0] ?? null
  },
  ['journal:one'],
  { revalidate: FALLBACK_REVALIDATE, tags: JOURNAL_TAGS },
)

export const getJournalEntries = cache(
  async (locale: Locale = defaultLocale, category?: string): Promise<Journal[]> => {
    try {
      return await fetchJournalEntries(locale, await isPreview(), category)
    } catch (error) {
      console.error('Failed to load journal entries from Payload.', error)

      return []
    }
  },
)

export const getJournalEntry = cache(
  async (slug: string, locale: Locale = defaultLocale): Promise<Journal | null> => {
    try {
      return await fetchJournalEntry(slug, locale, await isPreview())
    } catch (error) {
      console.error('Failed to load journal entry from Payload.', error)

      return null
    }
  },
)
