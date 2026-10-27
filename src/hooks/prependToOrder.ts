import type { CollectionBeforeChangeHook } from 'payload'
import { generateKeyBetween } from 'payload/shared'

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
