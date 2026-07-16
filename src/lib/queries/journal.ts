import type { Journal } from '@/payload-types'

import { defaultLocale, type Locale } from '../locale'
import { getPayloadClient } from '../payload'

const DEFAULT_LIMIT = 100

export async function getJournalEntries(
  locale: Locale = defaultLocale,
  category?: string,
): Promise<Journal[]> {
  try {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      depth: 2,
      limit: DEFAULT_LIMIT,
      locale,
      sort: ['-featured', 'order', '-date'],
      where: {
        visibility: { equals: 'public' },
        ...(category ? { category: { equals: category } } : {}),
      },
    })

    return entries.docs
  } catch (error) {
    console.error('Failed to load journal entries from Payload.', error)

    return []
  }
}

export async function getJournalEntry(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<Journal | null> {
  try {
    const payload = await getPayloadClient()

    const entries = await payload.find({
      collection: 'journal',
      depth: 2,
      limit: 1,
      locale,
      where: {
        slug: { equals: slug },
        visibility: { equals: 'public' },
      },
    })

    return entries.docs[0] ?? null
  } catch (error) {
    console.error('Failed to load journal entry from Payload.', error)

    return null
  }
}
