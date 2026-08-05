import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

type MaybeHidden = { visibility?: 'public' | 'private' | null } | null | undefined

function revalidate(tag: string) {
  try {
    // 'max' is the drop-in replacement for the deprecated single-argument form
    // of revalidateTag — it purges the tag immediately, which is what we want
    // here: the next visitor gets the freshly published content.
    revalidateTag(tag, 'max')
  } catch {
    // revalidateTag only works inside a Next.js request context — not
    // available when Payload runs from a standalone script or `payload
    // migrate`. Safe to skip in that case, there's no route cache to bust.
  }
}

function isHidden(doc: MaybeHidden) {
  return doc?.visibility === 'private'
}

function shouldSkip(context: Record<string, unknown> | undefined) {
  // Escape hatch for the maintenance scripts in `scripts/`, which can touch
  // hundreds of documents in one run and have no reason to invalidate the site
  // once per document.
  return context?.disableRevalidate === true
}

/**
 * Invalidates the pages that render this collection, by tag.
 *
 * The tag is the collection slug, which is exactly what the queries in
 * `src/lib/queries` declare as a dependency — so a single call reaches every
 * affected page, in both locales, and leaves the rest of the site cached. The
 * previous implementation called `revalidatePath('/{locale}', 'layout')` once
 * per locale, which invalidated all 34 prerendered routes twice over on every
 * single save.
 */
export const revalidateCollectionAfterChange: CollectionAfterChangeHook = ({
  collection,
  context,
  doc,
  operation,
  previousDoc,
}) => {
  if (shouldSkip(context)) {
    return doc
  }

  // A freshly uploaded media file is not referenced by any page yet: the
  // document that will reference it triggers its own revalidation when it is
  // saved. Skipping creates matters here — the collection holds ~200 docs and
  // every upload used to rebuild the whole site.
  if (collection.slug === 'media' && operation === 'create') {
    return doc
  }

  // Private documents are filtered out of every query, so editing one that was
  // already private changes nothing on the site. Toggling the flag either way
  // does, and still revalidates.
  const wasHidden = operation === 'create' ? true : isHidden(previousDoc as MaybeHidden)

  if (isHidden(doc as MaybeHidden) && wasHidden) {
    return doc
  }

  revalidate(collection.slug)

  return doc
}

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({
  collection,
  context,
  doc,
}) => {
  if (shouldSkip(context)) {
    return doc
  }

  // Deleting an already-private document removes nothing from the site.
  if (isHidden(doc as MaybeHidden)) {
    return doc
  }

  revalidate(collection.slug)

  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ context, doc, global }) => {
  if (shouldSkip(context)) {
    return doc
  }

  revalidate(global.slug)

  return doc
}
