import { cache } from 'react'

import type { Journal } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'
import { statusWhere } from './status'

const DEFAULT_LIMIT = 100

export const getJournalEntries = cache(
  async (
    locale: Locale = defaultLocale,
    category?: string,
    draft = false,
  ): Promise<Journal[]> => {
    try {
      const payload = await getPayloadClient()

      const entries = await payload.find({
        collection: 'journal',
        depth: 2,
        draft,
        limit: DEFAULT_LIMIT,
        locale,
        sort: ['-featured', 'order', '-date'],
        where: {
          ...statusWhere(draft),
          ...(category ? { category: { equals: category } } : {}),
        },
      })

      return entries.docs
    } catch (error) {
      console.error('Failed to load journal entries from Payload.', error)

      return []
    }
  },
)

export const getJournalEntry = cache(
  async (slug: string, locale: Locale = defaultLocale, draft = false): Promise<Journal | null> => {
    try {
      const payload = await getPayloadClient()

      const entries = await payload.find({
        collection: 'journal',
        depth: 2,
        draft,
        limit: 1,
        locale,
        where: {
          slug: { equals: slug },
          ...statusWhere(draft),
        },
      })

      return entries.docs[0] ?? null
    } catch (error) {
      console.error('Failed to load journal entry from Payload.', error)

      return null
    }
  },
)
