import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'
import { generateKeyBetween } from 'payload/shared'

import { readMainRow, revalidate } from './revalidateSite'

/**
 * Puts a new document at the top of an `orderable` collection.
 *
 * Payload's own hook appends: it gives a document without `_order` a key after
 * the last one. A new project or journal entry is usually the one to show
 * first, so this runs before it (config hooks come ahead of the one Payload
 * adds while sanitizing) and sets a key before the current first document.
 * Payload's hook then finds `_order` filled and leaves it.
 *
 * Only on create: an update without `_order` in its data keeps the stored key.
 * A duplicate counts as a create (Payload strips `_order` from the copy), so it
 * lands on top too.
 */
export const prependToOrder: CollectionBeforeChangeHook = async ({
  collection,
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || data._order) {
    return data
  }

  const { docs } = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    select: { _order: true },
    sort: '_order',
    where: { _order: { exists: true } },
  })
  const firstKey = (docs[0] as { _order?: string | null } | undefined)?._order ?? null

  data._order = generateKeyBetween(null, firstKey)

  return data
}

/**
 * Keeps a drag-and-drop reorder visible on a document that has a draft.
 *
 * Payload's reorder endpoint saves each moved document the way its latest
 * version is saved: as a draft when one is pending (an autosave, a draft never
 * published). The new `_order` then only reaches a version, while the list
 * and the site read the main row — the row snaps back to its old place.
 * Copying `_order` onto the main row fixes that without touching anything
 * else: `db.updateOne` with a single plain column is one `UPDATE … SET`, with
 * no version and no hook. The site changes only if that row is published.
 */
export const syncDraftOrder: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  if (doc._status !== 'draft' || !doc._order) {
    return doc
  }

  const main = await readMainRow(req, collection.slug, doc.id)

  if (!main || main._order === doc._order) {
    return doc
  }

  await req.payload.db.updateOne({
    collection: collection.slug,
    data: { _order: doc._order },
    id: doc.id,
    req,
  })

  if (main._status === 'published') {
    revalidate(collection.slug)
  }

  return doc
}
