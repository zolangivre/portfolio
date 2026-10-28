import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  getPendingDrafts,
  getRecentChanges,
  getScheduledPublishes,
  getUnreadMessages,
} from '@/lib/queries/dashboard'
import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * The data behind the admin dashboard widgets: unread messages, documents
 * whose latest version is a draft, pending scheduled publications and the
 * latest changes. The test database is shared by the whole suite, so every
 * record is prefixed and the assertions only look at ours.
 */

// Outside a Next request revalidateTag throws and the hooks swallow it.
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const config = await configPromise

const PREFIX = 'dash-'

let payload: Payload
const projectIds: number[] = []
const technologyIds: number[] = []
const messageIds: number[] = []
let heroOriginal: Record<string, unknown>

const createProject = async (
  slug: string,
  status: 'published' | 'draft',
  extra: { title?: string; draft?: boolean } = {},
) => {
  const { draft, title = slug } = extra
  const doc = await payload.create({
    collection: 'projects',
    data: {
      _status: status,
      description: textToLexicalParagraphs('Description.'),
      shortDescription: 'Short description.',
      slug,
      title,
    },
    draft,
  })
  projectIds.push(doc.id)
  return doc
}

const createMessage = async (name: string, extra: { read?: boolean } = {}) => {
  const doc = await payload.create({
    collection: 'messages',
    data: { email: 'dash@test.local', message: 'Hello.', name, ...extra },
  })
  messageIds.push(doc.id)
  return doc
}

const createTechnology = async (slug: string) => {
  const doc = await payload.create({ collection: 'technologies', data: { name: slug, slug } })
  technologyIds.push(doc.id)
  return doc
}

const queue = (
  id: number,
  type: 'publish' | 'unpublish',
  waitUntil: Date,
  relationTo: 'projects' = 'projects',
) =>
  payload.jobs.queue({
    input: { doc: { relationTo, value: id }, type },
    task: 'schedulePublish',
    waitUntil,
  })

const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000)

const projectHref = (id: number) => `/admin/collections/projects/${id}`

beforeAll(async () => {
  payload = await getPayload({ config })
  heroOriginal = (await payload.findGlobal({ slug: 'hero' })) as unknown as Record<string, unknown>
})

afterAll(async () => {
  // The hero is shared with the other files: put back what it held.
  await payload
    .updateGlobal({
      slug: 'hero',
      data: { title: heroOriginal.title, _status: 'published' } as never,
    })
    .catch((error: unknown) => {
      // A never-saved hero reads as defaults that break their own maxLength.
      if ((error as Error).name !== 'ValidationError') throw error
    })
  for (const id of messageIds) await payload.delete({ collection: 'messages', id, trash: true })
  for (const id of projectIds) await payload.delete({ collection: 'projects', id, trash: true })
  for (const id of technologyIds) await payload.delete({ collection: 'technologies', id })
  await payload?.destroy()
})

describe('getUnreadMessages', () => {
  let baseline: number
  const unreadNames: string[] = []

  beforeAll(async () => {
    baseline = (await getUnreadMessages(payload)).total

    // Seven unread, oldest first...
    for (let i = 1; i <= 7; i++) {
      const name = `${PREFIX}unread-${i}`
      unreadNames.push(name)
      await createMessage(name)
    }
    // ...then the newest of all: one already read, one unread but trashed.
    // If either leaked into the list they would head it.
    await createMessage(`${PREFIX}read`, { read: true })
    const trashed = await createMessage(`${PREFIX}trashed`)
    await payload.update({
      collection: 'messages',
      data: { deletedAt: new Date().toISOString() },
      id: trashed.id,
    })
  })

  it('counts every unread message, but not the read or the trashed one', async () => {
    const { total } = await getUnreadMessages(payload)

    expect(total - baseline).toBe(7)
  })

  it('lists the five newest unread messages, newest first', async () => {
    const { latest } = await getUnreadMessages(payload)

    expect(latest).toHaveLength(5)
    expect(latest.map((message) => message.name)).toEqual(unreadNames.slice(2).reverse())
  })

  it('gives each message its id, name and creation date', async () => {
    const { latest } = await getUnreadMessages(payload)
    const newest = latest[0]!
    const created = messageIds.find((id) => id === newest.id)

    expect(created).toBeDefined()
    expect(newest.name).toBe(`${PREFIX}unread-7`)
    expect(new Date(newest.createdAt).toString()).not.toBe('Invalid Date')
  })

  it('drops a message from the list once it is read', async () => {
    const { latest } = await getUnreadMessages(payload)
    const newest = latest[0]!
    const before = (await getUnreadMessages(payload)).total

    await payload.update({ collection: 'messages', data: { read: true }, id: newest.id })

    const after = await getUnreadMessages(payload)
    expect(after.total).toBe(before - 1)
    expect(after.latest.map((message) => message.id)).not.toContain(newest.id)
    expect(after.latest[0]?.name).toBe(`${PREFIX}unread-6`)
  })
})

describe('getPendingDrafts', () => {
  let publishedWithDraft: number
  let neverPublished: number
  let untitled: number
  let publishedClean: number

  const ours = () => getPendingDrafts(payload)

  beforeAll(async () => {
    publishedClean = (await createProject(`${PREFIX}clean`, 'published')).id

    const published = await createProject(`${PREFIX}published-edit`, 'published')
    publishedWithDraft = published.id
    await payload.update({
      collection: 'projects',
      data: { shortDescription: 'Edited, not published yet.' },
      draft: true,
      id: published.id,
    })

    neverPublished = (await createProject(`${PREFIX}never-published`, 'draft')).id
    untitled = (await createProject(`${PREFIX}untitled`, 'draft', { draft: true, title: '' })).id
  })

  it('lists the draft of a published project, with its title and admin link', async () => {
    const item = (await ours()).find((entry) => entry.href === projectHref(publishedWithDraft))

    expect(item).toBeDefined()
    expect(item?.label).toBe(`${PREFIX}published-edit`)
    expect(item?.collectionLabel).toMatch(/^Projets?$/)
    expect(new Date(item!.updatedAt).toString()).not.toBe('Invalid Date')
  })

  it('lists a project that was never published', async () => {
    const item = (await ours()).find((entry) => entry.href === projectHref(neverPublished))

    expect(item?.label).toBe(`${PREFIX}never-published`)
  })

  it('names a document without a title "Sans titre"', async () => {
    const item = (await ours()).find((entry) => entry.href === projectHref(untitled))

    expect(item?.label).toBe('Sans titre')
  })

  it('leaves out a published project that has no pending draft', async () => {
    const hrefs = (await ours()).map((entry) => entry.href)

    expect(hrefs).not.toContain(projectHref(publishedClean))
  })

  it('lists newest first', async () => {
    const hrefs = (await ours()).map((entry) => entry.href)
    const position = (id: number) => hrefs.indexOf(projectHref(id))

    expect(position(untitled)).toBeGreaterThanOrEqual(0)
    expect(position(untitled)).toBeLessThan(position(neverPublished))
    expect(position(neverPublished)).toBeLessThan(position(publishedWithDraft))
  })

  it('drops a document once its draft is published', async () => {
    const doc = await createProject(`${PREFIX}soon-published`, 'draft')
    expect((await ours()).map((entry) => entry.href)).toContain(projectHref(doc.id))

    await payload.update({ collection: 'projects', data: { _status: 'published' }, id: doc.id })

    expect((await ours()).map((entry) => entry.href)).not.toContain(projectHref(doc.id))
  })

  it('lists a global with a pending draft, linking to the global', async () => {
    await payload.updateGlobal({
      slug: 'hero',
      data: { title: `${PREFIX}hero live`, _status: 'published' },
    })
    expect((await ours()).map((entry) => entry.href)).not.toContain('/admin/globals/hero')

    await payload.updateGlobal({
      slug: 'hero',
      data: { title: `${PREFIX}hero draft` },
      draft: true,
    })

    const item = (await ours()).find((entry) => entry.href === '/admin/globals/hero')
    expect(item).toBeDefined()
    expect(item?.label).toBeTruthy()
    expect(item?.collectionLabel).toBeTruthy()
    expect(new Date(item!.updatedAt).toString()).not.toBe('Invalid Date')

    // Newest first: the global was saved after every project above.
    expect((await ours())[0]?.href).toBe('/admin/globals/hero')
  })

  it('drops a global once its draft is published', async () => {
    await payload.updateGlobal({
      slug: 'hero',
      data: { title: `${PREFIX}hero published`, _status: 'published' },
    })

    expect((await ours()).map((entry) => entry.href)).not.toContain('/admin/globals/hero')
  })

  it('returns at most ten documents, newest first', async () => {
    const created: number[] = []
    for (let i = 1; i <= 11; i++) {
      created.push((await createProject(`${PREFIX}many-${i}`, 'draft')).id)
    }

    const items = await getPendingDrafts(payload)

    expect(items).toHaveLength(10)
    // The ten newest are the last ten created, the first of the eleven is cut.
    expect(items.map((item) => item.href)).toEqual(
      created
        .slice(1)
        .reverse()
        .map((id) => projectHref(id)),
    )
  })
})

describe('getScheduledPublishes', () => {
  // Far enough ahead that the other files' jobs.run() never picks them up.
  const beforeCron = new Date('2099-03-10T05:00:00.000Z')
  const afterCron = new Date('2099-03-10T09:00:00.000Z')
  const atCron = new Date('2099-03-12T07:00:00.000Z')
  let early: number
  let late: number
  let exact: number
  let unpublishing: number
  let done: number
  let failed: number // id of a project deleted after its job was queued

  const mine = async (ids: number[]) =>
    (await getScheduledPublishes(payload)).filter((item) =>
      ids.some((id) => item.href === projectHref(id)),
    )

  beforeAll(async () => {
    early = (await createProject(`${PREFIX}sched-early`, 'draft')).id
    late = (await createProject(`${PREFIX}sched-late`, 'draft')).id
    exact = (await createProject(`${PREFIX}sched-exact`, 'draft')).id
    unpublishing = (await createProject(`${PREFIX}sched-unpublish`, 'published')).id
    done = (await createProject(`${PREFIX}sched-done`, 'draft')).id

    // Queued out of order, to check the list sorts them.
    await queue(late, 'publish', afterCron)
    await queue(unpublishing, 'unpublish', new Date('2099-03-11T05:00:00.000Z'))
    await queue(exact, 'publish', atCron)
    await queue(early, 'publish', beforeCron)

    // One job that has run to completion, one that failed (its document is
    // gone): neither is pending any more.
    await queue(done, 'publish', yesterday())
    const ghost = await createProject(`${PREFIX}sched-ghost`, 'draft')
    await payload.delete({ collection: 'projects', id: ghost.id })
    projectIds.splice(projectIds.indexOf(ghost.id), 1)
    failed = ghost.id
    await queue(failed, 'publish', yesterday())
    await payload.jobs.run()
  })

  it('lists pending jobs soonest first', async () => {
    const items = await mine([early, late, exact, unpublishing])

    expect(items.map((item) => item.href)).toEqual([
      projectHref(early), // 10 Mar 05:00
      projectHref(late), // 10 Mar 09:00
      projectHref(unpublishing), // 11 Mar 05:00
      projectHref(exact), // 12 Mar 07:00
    ])
  })

  it('gives the document title, the type, the link and the wait date', async () => {
    const [item] = await mine([early])

    expect(item?.label).toBe(`${PREFIX}sched-early`)
    expect(item?.type).toBe('publish')
    expect(item?.href).toBe(projectHref(early))
    expect(new Date(item!.waitUntil).toISOString()).toBe(beforeCron.toISOString())
  })

  it('reports an unpublication as such', async () => {
    const [item] = await mine([unpublishing])

    expect(item?.type).toBe('unpublish')
    expect(item?.label).toBe(`${PREFIX}sched-unpublish`)
  })

  it('goes out at 07:00 UTC the same day when the date is before 07:00 UTC', async () => {
    const [item] = await mine([early])

    expect(new Date(item!.goesOutAt).toISOString()).toBe('2099-03-10T07:00:00.000Z')
  })

  it('goes out at 07:00 UTC the next day when the date is after 07:00 UTC', async () => {
    const [item] = await mine([late])

    expect(new Date(item!.goesOutAt).toISOString()).toBe('2099-03-11T07:00:00.000Z')
  })

  it('goes out at the very date when it is exactly 07:00 UTC', async () => {
    const [item] = await mine([exact])

    expect(new Date(item!.goesOutAt).toISOString()).toBe('2099-03-12T07:00:00.000Z')
  })

  it('leaves out a job that has completed', async () => {
    expect(await mine([done])).toEqual([])
  })

  it('leaves out a job that failed', async () => {
    expect(await mine([failed])).toEqual([])
  })
})

describe('getRecentChanges', () => {
  const created: { id: number; href: string }[] = []

  beforeAll(async () => {
    // Nine documents across two collections, then a message and a user,
    // which must never show up whatever their date.
    for (let i = 1; i <= 9; i++) {
      if (i % 2) {
        const doc = await createProject(`${PREFIX}recent-${i}`, 'published')
        created.push({ id: doc.id, href: projectHref(doc.id) })
      } else {
        const doc = await createTechnology(`${PREFIX}recent-${i}`)
        created.push({ id: doc.id, href: `/admin/collections/technologies/${doc.id}` })
      }
    }
    await createMessage(`${PREFIX}recent-message`)
  })

  it('returns the eight most recently changed documents, newest first', async () => {
    const items = await getRecentChanges(payload)

    expect(items).toHaveLength(8)
    expect(items.map((item) => item.href)).toEqual(
      created
        .slice(1)
        .reverse()
        .map((doc) => doc.href),
    )
    expect(items.map((item) => item.label)).toEqual(
      [2, 3, 4, 5, 6, 7, 8, 9].reverse().map((i) => `${PREFIX}recent-${i}`),
    )
  })

  it('names the collection of each document', async () => {
    const items = await getRecentChanges(payload)

    // The ninth document is a project, the eighth a technology.
    expect(items[0]?.collectionLabel).toMatch(/^Projets?$/)
    expect(items[1]?.collectionLabel).toMatch(/^Technologies?$/)
    expect(new Date(items[0]!.updatedAt).toString()).not.toBe('Invalid Date')
  })

  it('leaves out messages', async () => {
    const items = await getRecentChanges(payload)

    expect(items.map((item) => item.label)).not.toContain(`${PREFIX}recent-message`)
    expect(items.some((item) => item.href.includes('/collections/messages'))).toBe(false)
  })

  it('leaves out users and jobs', async () => {
    const items = await getRecentChanges(payload)

    expect(items.some((item) => /\/collections\/(users|payload-jobs)\//.test(item.href))).toBe(
      false,
    )
  })

  it('moves a document to the top when it is edited', async () => {
    const oldest = created[1]!

    await payload.update({
      collection: 'technologies',
      data: { name: `${PREFIX}recent-2 edited` },
      id: oldest.id,
    })

    const [first] = await getRecentChanges(payload)
    expect(first?.href).toBe(oldest.href)
    expect(first?.label).toBe(`${PREFIX}recent-2 edited`)
  })
})

describe('documents in the trash', () => {
  const trash = (id: number) =>
    payload.update({ collection: 'projects', data: { deletedAt: new Date().toISOString() }, id })
  const restore = (id: number) =>
    payload.update({ collection: 'projects', data: { deletedAt: null }, id, trash: true })
  const hrefs = (items: { href: string }[]) => items.map((item) => item.href)

  it('leaves trashed drafts out of the pending drafts and the recent changes, until restored', async () => {
    const draft = await createProject(`${PREFIX}trash-draft`, 'draft')
    const published = await createProject(`${PREFIX}trash-pending`, 'published')
    await payload.update({
      collection: 'projects',
      data: { shortDescription: 'A pending change.' },
      draft: true,
      id: published.id,
    })

    expect(hrefs(await getPendingDrafts(payload))).toEqual(
      expect.arrayContaining([projectHref(draft.id), projectHref(published.id)]),
    )

    await trash(draft.id)
    await trash(published.id)

    expect(hrefs(await getPendingDrafts(payload))).not.toContain(projectHref(draft.id))
    expect(hrefs(await getPendingDrafts(payload))).not.toContain(projectHref(published.id))
    expect(hrefs(await getRecentChanges(payload))).not.toContain(projectHref(draft.id))

    await restore(draft.id)

    expect(hrefs(await getPendingDrafts(payload))).toContain(projectHref(draft.id))
  })

  it('flags a scheduled publish whose document is in the trash', async () => {
    const project = await createProject(`${PREFIX}trash-scheduled`, 'draft', {
      title: 'Trashed and scheduled',
    })
    await queue(project.id, 'publish', new Date('2099-04-01T05:00:00.000Z'))
    await trash(project.id)

    const item = (await getScheduledPublishes(payload)).find(
      (scheduled) => scheduled.href === projectHref(project.id),
    )

    expect(item?.label).toBe('Trashed and scheduled (à la corbeille)')
  })

  it('keeps the widget up when a job points at a collection that no longer exists', async () => {
    const job = await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { doc: { relationTo: 'gone', value: 1 }, type: 'publish' },
        taskSlug: 'schedulePublish',
        waitUntil: new Date('2099-05-01T05:00:00.000Z').toISOString(),
      },
    })

    try {
      const items = await getScheduledPublishes(payload)
      expect(items.find((item) => item.waitUntil.startsWith('2099-05-01'))?.label).toBe(
        'Sans titre',
      )
    } finally {
      await payload.delete({ collection: 'payload-jobs', id: job.id })
    }
  })
})

describe('dates the widgets format', () => {
  // A row without a valid date used to crash the dashboard (Intl throws on an
  // invalid date): a global never saved reads as `_status: 'draft'` with no
  // `updatedAt`, as on a fresh database.
  it('gives every pending draft and recent change a valid date', async () => {
    for (const item of [
      ...(await getPendingDrafts(payload)),
      ...(await getRecentChanges(payload)),
    ]) {
      expect(Number.isNaN(new Date(item.updatedAt).getTime()), item.href).toBe(false)
    }
  })
})
