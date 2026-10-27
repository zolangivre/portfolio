import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

type MaybeHidden = { _status?: 'draft' | 'published' | null } | null | undefined

export function revalidate(tag: string) {
  try {
    // Expires the tag outright: the next request waits for a fresh render
    // instead of getting the old page, so reloading right after a save shows
    // the edit. 'max' (stale-while-revalidate) served the stale page once
    // first. `updateTag` would be the idiomatic call, but it only works in
    // Server Actions — Payload saves arrive through Route Handlers, which is
    // the case Next documents `{ expire: 0 }` for. The cost is one render on
    // the first visit after a save.
    revalidateTag(tag, { expire: 0 })
  } catch {
    // revalidateTag only works inside a Next.js request context — not
    // available when Payload runs from a standalone script or `payload
    // migrate`. Safe to skip in that case, there's no route cache to bust.
  }
}

// A draft is filtered out of every query. Collections without drafts have no
// `_status`, so nothing in them is ever hidden.
function isHidden(doc: MaybeHidden) {
  return doc?._status === 'draft'
}

type MainRow = { _order?: string | null; _status?: 'draft' | 'published' | null }

/**
 * The document's main row — the one every query on the site reads. With
 * drafts, `doc` and `previousDoc` in a hook are the latest *versions*: an
 * autosave makes the latest version a draft while the main row stays
 * published, so neither tells what the site shows.
 *
 * `null` when the document doesn't exist, `undefined` when the lookup failed:
 * it only serves cache decisions, so an error is logged rather than allowed
 * to fail the save.
 */
export async function readMainRow(
  req: PayloadRequest,
  collection: CollectionSlug,
  id: number | string,
): Promise<MainRow | null | undefined> {
  try {
    return (await req.payload.findByID({
      collection,
      depth: 0,
      disableErrors: true,
      draft: false,
      id,
      overrideAccess: true,
      req,
      select: { _order: true, _status: true },
    })) as MainRow | null
  } catch (err) {
    req.payload.logger.error({ err, msg: `Could not read ${collection} ${id} for revalidation.` })

    return undefined
  }
}

/** Whether the main row is published; `undefined` when that couldn't be read. */
async function isLive(req: PayloadRequest, collection: CollectionSlug, id: number | string) {
  const main = await readMainRow(req, collection, id)

  return main === undefined ? undefined : main?._status === 'published'
}

const wasLiveKey = (collection: string, id: unknown) =>
  `revalidate:wasLive:${collection}:${String(id)}`

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
export const revalidateCollectionAfterChange: CollectionAfterChangeHook = async ({
  collection,
  context,
  doc,
  operation,
  previousDoc,
  req,
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

  // Saving a draft leaves the published row alone, autosave included, so the
  // site only changes when the save unpublished a live document. Whether it
  // was live comes from rememberLiveState; without it (a collection that
  // doesn't register it, or a failed lookup), the latest version is the best
  // guess. When the main row can't be read now, revalidate to be safe.
  if (isHidden(doc as MaybeHidden)) {
    const remembered = context[wasLiveKey(collection.slug, doc.id)]
    const wasLive =
      operation === 'create'
        ? false
        : typeof remembered === 'boolean'
          ? remembered
          : (previousDoc as MaybeHidden)?._status === 'published'

    if (!wasLive || (await isLive(req, collection.slug, doc.id)) === true) {
      return doc
    }
  }

  revalidate(collection.slug)

  return doc
}

/**
 * Before a save on a collection with drafts, notes whether the document is on
 * the site, for revalidateCollectionAfterChange to compare against. Keyed by
 * document, since one request can save several (a drag-and-drop reorder).
 */
export const rememberLiveState: CollectionBeforeChangeHook = async ({
  collection,
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  // A publish always revalidates, so it needs no lookup.
  if (
    operation === 'update' &&
    originalDoc?.id !== undefined &&
    data._status !== 'published' &&
    !shouldSkip(context)
  ) {
    const live = await isLive(req, collection.slug, originalDoc.id)

    // Written to `req.context` after the lookup, not to the `context` argument:
    // a Local API call made with `req` replaces `req.context` with a copy, and
    // afterChange receives that copy.
    if (live !== undefined) {
      req.context[wasLiveKey(collection.slug, originalDoc.id)] = live
    }
  }

  return data
}

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({
  collection,
  context,
  doc,
}) => {
  if (shouldSkip(context)) {
    return doc
  }

  // Deleting a draft removes nothing from the site.
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
