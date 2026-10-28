import type { CollectionSlug, GlobalSlug, Payload } from 'payload'

import { nextCronRun } from '../dashboard'

/**
 * Data for the admin dashboard widgets (components/admin/dashboard): thin
 * Payload reads, covered by the integration tests like the rest of
 * lib/queries. Each
 * function takes the Payload instance and reads with access overridden: the
 * dashboard only renders for a logged-in editor, who may read everything.
 * Titles are read in the default locale, the one the admin edits first.
 */

const LOCALE = 'fr'
const UNTITLED = 'Sans titre'

/** The collections with drafts (collections/drafts.ts). */
const DRAFT_COLLECTIONS = ['projects', 'journal', 'experiences', 'education'] as const

/** Everything an editor writes, for "recent changes" (not accounts, messages or jobs). */
const CONTENT_COLLECTIONS = [
  ...DRAFT_COLLECTIONS,
  'testimonials',
  'skills',
  'technologies',
  'categories',
  'companies',
  'schools',
  'media',
  'videos',
] as const satisfies readonly CollectionSlug[]

export type DashboardItem = {
  collectionLabel: string
  href: string
  label: string
  updatedAt: string
}

type Doc = Record<string, unknown> & { id: number | string; updatedAt?: string }

const adminRoute = (payload: Payload) => payload.config.routes.admin

const collectionLabel = (payload: Payload, slug: CollectionSlug) => {
  const singular = payload.collections[slug].config.labels.singular

  return typeof singular === 'string' ? singular : slug
}

const globalLabel = (payload: Payload, slug: GlobalSlug) => {
  const label = payload.globals.config.find((global) => global.slug === slug)?.label

  return typeof label === 'string' ? label : slug
}

const titleOf = (payload: Payload, slug: CollectionSlug, doc: Doc) => {
  const field = payload.collections[slug].config.admin.useAsTitle
  const value = field ? doc[field] : undefined

  if (typeof value === 'string' && value.trim()) return value

  // Media and videos are titled by their alt text, often left empty: their
  // file name says more than "Sans titre".
  return typeof doc.filename === 'string' && doc.filename ? doc.filename : UNTITLED
}

const collectionItem = (payload: Payload, slug: CollectionSlug, doc: Doc): DashboardItem => ({
  collectionLabel: collectionLabel(payload, slug),
  href: `${adminRoute(payload)}/collections/${slug}/${doc.id}`,
  label: titleOf(payload, slug, doc),
  updatedAt: doc.updatedAt ?? '',
})

const newestFirst = (a: { updatedAt: string }, b: { updatedAt: string }) =>
  b.updatedAt.localeCompare(a.updatedAt)

/** Unread contact messages: how many, and the five newest. */
export async function getUnreadMessages(payload: Payload) {
  const { docs, totalDocs } = await payload.find({
    collection: 'messages',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    sort: '-createdAt',
    where: { read: { not_equals: true } },
  })

  return {
    latest: docs.map(({ createdAt, id, name }) => ({ createdAt, id, name })),
    total: totalDocs,
  }
}

/**
 * Documents whose latest version is a draft: never published, or published
 * with changes waiting. Newest first, ten at most.
 */
export async function getPendingDrafts(payload: Payload): Promise<DashboardItem[]> {
  const collections = await Promise.all(
    DRAFT_COLLECTIONS.map(async (slug) => {
      const { docs } = await payload.find({
        collection: slug,
        depth: 0,
        draft: true,
        limit: 10,
        locale: LOCALE,
        overrideAccess: true,
        sort: '-updatedAt',
        where: { _status: { equals: 'draft' } },
      })

      return docs.map((doc) => collectionItem(payload, slug, doc as unknown as Doc))
    }),
  )

  const globals = await Promise.all(
    payload.config.globals.map(async ({ slug }) => {
      const doc = (await payload.findGlobal({
        depth: 0,
        draft: true,
        locale: LOCALE,
        overrideAccess: true,
        slug: slug as GlobalSlug,
      })) as { _status?: string | null; updatedAt?: string | null }

      // A global never saved reads as its defaults, `_status: 'draft'`
      // included, with no `updatedAt`: nothing is pending there.
      return doc._status === 'draft' && doc.updatedAt
        ? [
            {
              collectionLabel: 'Global',
              href: `${adminRoute(payload)}/globals/${slug}`,
              label: globalLabel(payload, slug as GlobalSlug),
              updatedAt: doc.updatedAt ?? '',
            },
          ]
        : []
    }),
  )

  return [...collections.flat(), ...globals.flat()].sort(newestFirst).slice(0, 10)
}

type ScheduleInput = {
  doc?: { relationTo: CollectionSlug; value: number | string }
  global?: GlobalSlug
  type?: 'publish' | 'unpublish'
}

/** Pending scheduled publishes, soonest first, with when the cron will run them. */
export async function getScheduledPublishes(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'payload-jobs',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: 'waitUntil',
    where: {
      and: [
        { taskSlug: { equals: 'schedulePublish' } },
        { completedAt: { exists: false } },
        { hasError: { not_equals: true } },
      ],
    },
  })

  return Promise.all(
    docs.map(async (job) => {
      const input = (job.input ?? {}) as ScheduleInput
      const waitUntil = job.waitUntil ?? job.createdAt
      const target = await describeTarget(payload, input)

      return {
        ...target,
        goesOutAt: nextCronRun(new Date(waitUntil)).toISOString(),
        type: input.type === 'unpublish' ? ('unpublish' as const) : ('publish' as const),
        waitUntil,
      }
    }),
  )
}

async function describeTarget(
  payload: Payload,
  input: ScheduleInput,
): Promise<{ href: string; label: string }> {
  if (input.global && payload.config.globals.some(({ slug }) => slug === input.global)) {
    return {
      href: `${adminRoute(payload)}/globals/${input.global}`,
      label: globalLabel(payload, input.global),
    }
  }

  if (input.doc && input.doc.relationTo in payload.collections) {
    const { relationTo, value } = input.doc
    const id = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
    const href = `${adminRoute(payload)}/collections/${relationTo}/${id}`

    try {
      const doc = (await payload.findByID({
        collection: relationTo,
        depth: 0,
        disableErrors: true,
        draft: true,
        id,
        locale: LOCALE,
        overrideAccess: true,
        trash: true,
      })) as unknown as Doc | null

      // The job outlives its document: say so rather than show a normal row.
      if (!doc) return { href, label: `${UNTITLED} (supprimé)` }

      const label = titleOf(payload, relationTo, doc)

      return { href, label: doc.deletedAt ? `${label} (à la corbeille)` : label }
    } catch {
      // One unreadable job must not take the whole widget down.
      return { href, label: UNTITLED }
    }
  }

  // A job for a collection or global that no longer exists.
  return { href: adminRoute(payload), label: UNTITLED }
}

/** The eight most recently changed documents, across the content collections. */
export async function getRecentChanges(payload: Payload): Promise<DashboardItem[]> {
  const perCollection = await Promise.all(
    CONTENT_COLLECTIONS.map(async (slug) => {
      const { docs } = await payload.find({
        collection: slug,
        depth: 0,
        draft: (DRAFT_COLLECTIONS as readonly string[]).includes(slug),
        limit: 8,
        locale: LOCALE,
        overrideAccess: true,
        sort: '-updatedAt',
      })

      return docs.map((doc) => collectionItem(payload, slug, doc as unknown as Doc))
    }),
  )

  return perCollection.flat().sort(newestFirst).slice(0, 8)
}
