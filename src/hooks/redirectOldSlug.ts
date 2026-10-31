import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'

import { locales } from '@/lib/locale'
import { contentPath, type RedirectTarget } from '@/lib/redirects'

/**
 * When a published project or journal entry is published again under a new
 * slug, its old URL (in both locales) gets a redirect to the document, so a
 * link shared before the change still lands on it. The redirect references
 * the document rather than its new URL: a later rename can't leave a chain.
 *
 * The old slug is the main row's, the one the site served: with drafts,
 * `originalDoc` is the latest version, which may already hold a draft's slug.
 */

const oldSlugKey = (collection: string, id: unknown) =>
  `redirect:oldSlug:${collection}:${String(id)}`

export const rememberLiveSlug: CollectionBeforeChangeHook = async ({
  collection,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (
    operation !== 'update' ||
    originalDoc?.id === undefined ||
    data._status !== 'published' ||
    typeof data.slug !== 'string'
  ) {
    return data
  }

  const live = (await req.payload.findByID({
    collection: collection.slug,
    depth: 0,
    disableErrors: true,
    draft: false,
    id: originalDoc.id,
    overrideAccess: true,
    req,
    select: { _status: true, slug: true },
  })) as { _status?: string | null; slug?: string | null } | null

  // Written to `req.context`, not the `context` argument: see rememberLiveState.
  if (live?._status === 'published' && live.slug && live.slug !== data.slug) {
    req.context[oldSlugKey(collection.slug, originalDoc.id)] = live.slug
  }

  return data
}

export const redirectOldSlug: CollectionAfterChangeHook = async ({
  collection,
  context,
  doc,
  req,
}) => {
  const oldSlug = context[oldSlugKey(collection.slug, doc.id)]
  if (typeof oldSlug !== 'string' || doc._status !== 'published') return doc

  const to = {
    reference: { relationTo: collection.slug as RedirectTarget, value: doc.id },
    type: 'reference' as const,
  }

  for (const locale of locales) {
    const from = contentPath(collection.slug as RedirectTarget, oldSlug, locale)
    const { docs } = await req.payload.find({
      collection: 'redirects',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { from: { equals: from } },
    })

    if (docs[0]) {
      await req.payload.update({
        collection: 'redirects',
        data: { to },
        id: docs[0].id,
        overrideAccess: true,
        req,
      })
    } else {
      await req.payload.create({
        collection: 'redirects',
        data: { from, to },
        overrideAccess: true,
        req,
      })
    }
  }

  return doc
}
