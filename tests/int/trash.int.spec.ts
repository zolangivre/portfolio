import { revalidateTag } from 'next/cache'
import { draftMode, headers } from 'next/headers'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAllProjects, getProject } from '@/lib/queries'
import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * The trash: "Delete" in the admin sets `deletedAt`. A trashed project leaves
 * the site and the anonymous API, stays readable with `trash: true`, comes back
 * on restore; a trashed technology is `null` in the projects that used it.
 */

// The queries wrap their reads in unstable_cache, which needs a Next server:
// a pass-through keeps the read itself. Outside a request revalidateTag throws
// and the hooks swallow it; a mock lets the tests see the calls.
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) =>
    (...args: Args) =>
      fn(...args),
}))

vi.mock('next/headers', () => ({ draftMode: vi.fn(), headers: vi.fn() }))

const config = await configPromise

const EDITOR = { email: 'trash-editor@test.local', password: 'trash-editor' }

let payload: Payload
let editorToken: string
let editorId: number
const projectIds: number[] = []
const technologyIds: number[] = []

const createProject = async (
  slug: string,
  extra: { technologies?: number[]; _status?: 'draft' | 'published' } = {},
) => {
  const doc = await payload.create({
    collection: 'projects',
    data: {
      _status: 'published',
      description: textToLexicalParagraphs('Description.'),
      shortDescription: 'Short description.',
      slug,
      title: slug,
      ...extra,
    },
    locale: 'fr',
  })
  projectIds.push(doc.id)
  return doc
}

const createTechnology = async (slug: string) => {
  const doc = await payload.create({
    collection: 'technologies',
    data: { name: slug, slug },
  })
  technologyIds.push(doc.id)
  return doc
}

const trash = (collection: 'projects' | 'technologies', id: number) =>
  payload.update({
    collection,
    data: { deletedAt: new Date().toISOString() },
    id,
  })

const restore = (collection: 'projects' | 'technologies', id: number) =>
  payload.update({ collection, data: { deletedAt: null }, id, trash: true })

const rest = (path: string, init: RequestInit = {}) =>
  handleEndpoints({ config, request: new Request(`http://localhost:3000/api${path}`, init) })

const restSlugs = async (path: string, init?: RequestInit) => {
  const response = await rest(path, init)
  expect(response.status).toBe(200)
  const body = (await response.json()) as { docs: { slug: string }[] }
  return body.docs.map((doc) => doc.slug).sort()
}

beforeAll(async () => {
  payload = await getPayload({ config })

  // Draft Mode is off: the site reads what a visitor reads.
  vi.mocked(draftMode).mockReturnValue(
    Object.assign(Promise.resolve({ isEnabled: false }), { isEnabled: false }) as never,
  )
  vi.mocked(headers).mockResolvedValue(new Headers() as never)

  const user = await payload.create({ collection: 'users', data: EDITOR })
  editorId = user.id
  editorToken = (await payload.login({ collection: 'users', data: EDITOR })).token!
})

afterAll(async () => {
  for (const id of projectIds) {
    await payload.delete({ collection: 'projects', id, trash: true }).catch(() => undefined)
  }
  for (const id of technologyIds) {
    await payload.delete({ collection: 'technologies', id, trash: true }).catch(() => undefined)
  }
  await payload.delete({ collection: 'users', id: editorId })
  await payload?.destroy()
})

describe('a published project in the trash', () => {
  const slug = 'trash-visible'
  const list = `/projects?limit=0&where[slug][like]=${slug}`
  let id: number

  beforeAll(async () => {
    id = (await createProject(slug)).id
  })

  it('is on the site and in the anonymous API before it is trashed', async () => {
    expect((await getProject(slug, 'fr'))?.slug).toBe(slug)
    expect((await getAllProjects('fr')).map((p) => p.slug)).toContain(slug)
    expect(await restSlugs(list)).toEqual([slug])
  })

  it('disappears from the site queries and the anonymous API', async () => {
    await trash('projects', id)

    expect(await getProject(slug, 'fr')).toBeNull()
    expect((await getAllProjects('fr')).map((p) => p.slug)).not.toContain(slug)
    expect(await restSlugs(list)).toEqual([])
    expect((await rest(`/projects/${id}`)).status).toBe(404)
  })

  it('is hidden from a default read but found with trash: true', async () => {
    const visible = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
    })
    const inTrash = await payload.find({
      collection: 'projects',
      trash: true,
      where: { slug: { equals: slug } },
    })

    expect(visible.docs).toHaveLength(0)
    expect(inTrash.docs).toHaveLength(1)
    expect(inTrash.docs[0]?.deletedAt).toBeTruthy()
  })

  // `?trash=true` only drops Payload's own filter; the read access must still
  // keep the trash from visitors.
  it('stays out of an anonymous read that asks for the trash', async () => {
    expect(await restSlugs(`${list}&trash=true`)).toEqual([])
    expect((await rest(`/projects/${id}?trash=true`)).status).toBe(404)
  })

  it('is listed in the trash view of an editor over REST', async () => {
    const slugs = await restSlugs(`${list}&trash=true`, {
      headers: { Authorization: `JWT ${editorToken}` },
    })

    expect(slugs).toEqual([slug])
  })

  it('comes back, with its published content, after a restore', async () => {
    await restore('projects', id)

    expect((await getProject(slug, 'fr'))?.slug).toBe(slug)
    expect((await getAllProjects('fr')).map((p) => p.slug)).toContain(slug)
    expect(await restSlugs(list)).toEqual([slug])
    expect((await payload.findByID({ collection: 'projects', id })).deletedAt).toBeFalsy()
  })
})

describe('a technology in the trash', () => {
  it('drops out of project.technologies at depth 2, and is back after a restore', async () => {
    const kept = await createTechnology('trash-tech-kept')
    const trashed = await createTechnology('trash-tech-trashed')
    const project = await createProject('trash-tech-project', {
      technologies: [kept.id, trashed.id],
    })

    await trash('technologies', trashed.id)

    // Payload leaves the trashed technology out of the populated list (no
    // `null` in its place), so the site never sees it. presentTechnologies
    // still guards the lists against a `null`, which a single relation does
    // get.
    const during = await getProject('trash-tech-project', 'fr')
    expect(during?.technologies).toHaveLength(1)
    expect(during?.technologies?.[0]).toMatchObject({ id: kept.id })

    // The relation itself is untouched: the technology is only hidden.
    await restore('technologies', trashed.id)

    const after = await getProject('trash-tech-project', 'fr')
    expect(after?.technologies?.map((t) => (t as { id: number } | null)?.id).sort()).toEqual(
      [kept.id, trashed.id].sort(),
    )
    expect(project.id).toBeTypeOf('number')
  })
})

describe('the trash of a public collection without drafts', () => {
  it('is hidden from an anonymous read, even with ?trash=true', async () => {
    const technology = await createTechnology('trash-public-tech')
    await trash('technologies', technology.id)

    const response = await rest(
      `/technologies?limit=0&trash=true&where[slug][equals]=trash-public-tech`,
    )
    expect(response.status).toBe(200)
    expect(((await response.json()) as { docs: unknown[] }).docs).toEqual([])

    const asEditor = await rest(
      `/technologies?limit=0&trash=true&where[slug][equals]=trash-public-tech`,
      { headers: { Authorization: `JWT ${editorToken}` } },
    )
    expect(((await asEditor.json()) as { docs: unknown[] }).docs).toHaveLength(1)
  })
})

describe('a message sent through the contact form', () => {
  it('cannot be created straight into the trash by a visitor', async () => {
    const response = await rest('/messages', {
      body: JSON.stringify({
        deletedAt: '2026-01-01T00:00:00.000Z',
        email: 'visitor@test.local',
        message: 'Hello from a visitor trying to hide this.',
        name: 'Trash visitor',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(response.status).toBe(201)
    const { doc } = (await response.json()) as { doc: { id: number } }

    const stored = await payload.findByID({ collection: 'messages', id: doc.id, trash: true })
    expect(stored.deletedAt ?? null).toBeNull()

    await payload.delete({ collection: 'messages', id: doc.id, trash: true })
  })
})

describe('revalidation', () => {
  let id: number

  beforeAll(async () => {
    id = (await createProject('trash-revalidate')).id
  })

  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear()
  })

  it('revalidates the projects tag when a project is trashed', async () => {
    await trash('projects', id)

    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })
  })

  it('revalidates the projects tag when it is restored', async () => {
    await restore('projects', id)

    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })
  })

  it('revalidates the projects tag when it is deleted for good', async () => {
    await trash('projects', id)
    vi.mocked(revalidateTag).mockClear()

    await payload.delete({ collection: 'projects', id, trash: true })

    expect(revalidateTag).toHaveBeenCalledWith('projects', { expire: 0 })
  })
})

describe('deleting a trashed document for good', () => {
  it('removes it, including from the trash', async () => {
    const { id } = await createProject('trash-permanent')
    await trash('projects', id)

    await payload.delete({ collection: 'projects', id, trash: true })

    const left = await payload.find({
      collection: 'projects',
      trash: true,
      where: { slug: { equals: 'trash-permanent' } },
    })
    expect(left.docs).toHaveLength(0)
  })

  it('does not let an anonymous caller trash or delete a project', async () => {
    const { id } = await createProject('trash-anonymous')

    const patch = await rest(`/projects/${id}`, {
      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })

    expect([401, 403]).toContain(patch.status)
    expect((await payload.findByID({ collection: 'projects', id })).deletedAt).toBeFalsy()
  })
})
