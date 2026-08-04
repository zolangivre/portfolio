import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { locales } from '@/lib/locale'

function revalidateSite() {
  try {
    for (const locale of locales) {
      revalidatePath(`/${locale}`, 'layout')
    }
  } catch {
    // revalidatePath only works inside a Next.js request context — not
    // available when Payload runs from a standalone script or `payload
    // migrate`. Safe to skip in that case, there's no route cache to bust.
  }
}

/**
 * Drafts never appear on the public site, so busting the route cache for them
 * is pointless work. It matters because autosave fires afterChange roughly
 * every 800ms while typing — without this guard, editing one paragraph would
 * blow away the whole site's cache dozens of times.
 *
 * A doc going from published back to draft still needs a revalidation (it has
 * to disappear from the site), so this only skips when the *previous* version
 * was already a draft too.
 */
function shouldSkipRevalidation(doc: unknown, previousDoc: unknown): boolean {
  const status = (doc as { _status?: string } | null)?._status
  const previousStatus = (previousDoc as { _status?: string } | null)?._status

  return status === 'draft' && previousStatus !== 'published'
}

export const revalidateCollectionAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (!shouldSkipRevalidation(doc, previousDoc)) {
    revalidateSite()
  }

  return doc
}

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc, previousDoc }) => {
  if (!shouldSkipRevalidation(doc, previousDoc)) {
    revalidateSite()
  }

  return doc
}
