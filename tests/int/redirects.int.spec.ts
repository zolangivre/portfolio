import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { getRedirectDestination } from '@/lib/queries'
import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * Old URLs of the site: the redirect a renamed project or journal entry gets
 * on its own (hooks/redirectOldSlug.ts), and where a redirect sends a visitor
 * (lib/queries/redirects.ts), read the way the pages read it.
 */

// The queries wrap their reads in unstable_cache, which needs a Next server:
// a pass-through keeps the read itself.
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) =>
    (...args: Args) =>
      fn(...args),
}))

let payload: Payload
const projectIds: number[] = []
const redirectIds: number[] = []

const createProject = async (slug: string, status: 'draft' | 'published' = 'published') => {
  const project = await payload.create({
    collection: 'projects',
    data: {
      _status: status,
      description: textToLexicalParagraphs('Redirect test.'),
      shortDescription: 'Redirect test.',
      slug,
      title: `Project ${slug}`,
    },
  })
  projectIds.push(project.id)
  return project
}

const publishAs = (id: number, slug: string) =>
  payload.update({ collection: 'projects', data: { _status: 'published', slug }, id })

const redirectsFrom = async (...paths: string[]) => {
  const { docs } = await payload.find({
    collection: 'redirects',
    depth: 0,
    where: { from: { in: paths } },
  })
  redirectIds.push(...docs.map((doc) => doc.id))
  return docs
}

beforeAll(async () => {
  payload = await getPayload({ config: configPromise })
})

afterAll(async () => {
  for (const id of redirectIds) {
    await payload.delete({ collection: 'redirects', id }).catch(() => undefined)
  }
  for (const id of projectIds) {
    await payload.delete({ collection: 'projects', id, trash: true }).catch(() => undefined)
  }
  await payload?.destroy()
})

describe('renaming a published project', () => {
  it('redirects its old URL, in both locales, to its new one', async () => {
    const project = await createProject('redirect-old')

    await publishAs(project.id, 'redirect-new')

    expect(
      await redirectsFrom('/fr/projects/redirect-old', '/en/projects/redirect-old'),
    ).toHaveLength(2)
    expect(await getRedirectDestination('/fr/projects/redirect-old')).toBe(
      '/fr/projects/redirect-new',
    )
    expect(await getRedirectDestination('/en/projects/redirect-old')).toBe(
      '/en/projects/redirect-new',
    )
  })

  it('keeps every old URL pointing at the latest one after a second rename', async () => {
    const project = await createProject('redirect-first')

    await publishAs(project.id, 'redirect-second')
    await publishAs(project.id, 'redirect-third')
    await redirectsFrom('/fr/projects/redirect-first', '/fr/projects/redirect-second')
    await redirectsFrom('/en/projects/redirect-first', '/en/projects/redirect-second')

    expect(await getRedirectDestination('/fr/projects/redirect-first')).toBe(
      '/fr/projects/redirect-third',
    )
    expect(await getRedirectDestination('/fr/projects/redirect-second')).toBe(
      '/fr/projects/redirect-third',
    )
  })

  it('waits for the publish: a draft under a new slug moves nothing', async () => {
    const project = await createProject('redirect-live')

    await payload.update({
      collection: 'projects',
      data: { slug: 'redirect-drafted' },
      draft: true,
      id: project.id,
    })
    expect(await redirectsFrom('/fr/projects/redirect-live')).toHaveLength(0)

    await publishAs(project.id, 'redirect-drafted')
    expect(await getRedirectDestination('/fr/projects/redirect-live')).toBe(
      '/fr/projects/redirect-drafted',
    )
  })

  it('creates nothing for a project that was never on the site', async () => {
    const project = await createProject('redirect-never-live', 'draft')

    await publishAs(project.id, 'redirect-now-live')

    expect(await redirectsFrom('/fr/projects/redirect-never-live')).toHaveLength(0)
  })

  it('stops redirecting once the project is unpublished or trashed', async () => {
    const project = await createProject('redirect-gone-old')
    await publishAs(project.id, 'redirect-gone-new')
    await redirectsFrom('/fr/projects/redirect-gone-old', '/en/projects/redirect-gone-old')

    await payload.update({ collection: 'projects', data: { _status: 'draft' }, id: project.id })
    expect(await getRedirectDestination('/fr/projects/redirect-gone-old')).toBeNull()

    await payload.update({ collection: 'projects', data: { _status: 'published' }, id: project.id })
    await payload.update({
      collection: 'projects',
      data: { deletedAt: new Date().toISOString() },
      id: project.id,
    })
    expect(await getRedirectDestination('/fr/projects/redirect-gone-old')).toBeNull()
  })
})

describe('a redirect typed in the admin', () => {
  it('is stored as a clean path, and a locale-less one covers both locales', async () => {
    const redirect = await payload.create({
      collection: 'redirects',
      data: {
        from: 'https://www.zolangivre.com/old-page/?x=1',
        to: { type: 'custom', url: '/fr/journal' },
      },
    })
    redirectIds.push(redirect.id)

    expect(redirect.from).toBe('/old-page')
    expect(await getRedirectDestination('/fr/old-page')).toBe('/fr/journal')
    expect(await getRedirectDestination('/en/old-page/')).toBe('/fr/journal')
    expect(await getRedirectDestination('/fr/never-redirected')).toBeNull()
  })

  it('prefers the exact path over its locale-less form', async () => {
    for (const [from, url] of [
      ['/both', 'https://example.com/both'],
      ['/en/both', 'https://example.com/en'],
    ]) {
      const redirect = await payload.create({
        collection: 'redirects',
        data: { from: from!, to: { type: 'custom', url: url! } },
      })
      redirectIds.push(redirect.id)
    }

    expect(await getRedirectDestination('/en/both')).toBe('https://example.com/en')
    expect(await getRedirectDestination('/fr/both')).toBe('https://example.com/both')
  })
})
