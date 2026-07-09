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

export const revalidateCollectionAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}
