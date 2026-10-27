import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { Journal } from '@/payload-types'

import { cacheTags, FALLBACK_REVALIDATE } from '../cache'
import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 100

// depth: 2 inlines the category and the cover/gallery images.
const JOURNAL_TAGS = [cacheTags.journal, cacheTags.categories, cacheTags.media]

const fetchJournalEntries = unstable_cache(
  async (locale: Locale, category?: string): Promise<Journal[]> => {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: '_order',
      where: {
        _status: { equals: 'published' },
        ...(category ? { category: { equals: category } } : {}),
      },
    })

    return entries.docs
  },
  ['journal:all'],
  { revalidate: FALLBACK_REVALIDATE, tags: JOURNAL_TAGS },
)

const fetchJournalEntry = unstable_cache(
  async (slug: string, locale: Locale): Promise<Journal | null> => {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      depth: 2,
      limit: 1,
      locale,
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
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
      return await fetchJournalEntries(locale, category)
    } catch (error) {
      console.error('Failed to load journal entries from Payload.', error)

      return []
    }
  },
)

export const getJournalEntry = cache(
  async (slug: string, locale: Locale = defaultLocale): Promise<Journal | null> => {
    try {
      return await fetchJournalEntry(slug, locale)
    } catch (error) {
      console.error('Failed to load journal entry from Payload.', error)

      return null
    }
  },
)
