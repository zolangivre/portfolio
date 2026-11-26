import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { getJournalEntry, getProject, getRedirectDestination } from '@/lib/queries'
import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * Each cache entry the site writes costs the operator, and the paths and slugs
 * it reads come from whoever asks. An unknown URL must not leave an entry of
 * its own: bots try thousands. Every `unstable_cache` call is recorded here,
 * with the arguments its key is built from.
 */

const calls: { args: unknown[]; key: string }[] = []

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache:
    <Args extends unknown[], Result>(
      fn: (...args: Args) => Promise<Result>,
      keyParts: string[] = [],
    ) =>
    (...args: Args) => {
      calls.push({ args, key: keyParts.join(':') })
      return fn(...args)
    },
}))

const config = await configPromise

let payload: Payload
let projectId: number

beforeAll(async () => {
  payload = await getPayload({ config })

  projectId = (
    await payload.create({
      collection: 'projects',
      data: {
        _status: 'published',
        description: textToLexicalParagraphs('Cache keys.'),
        shortDescription: 'Cache keys.',
        slug: 'cache-keys-project',
        title: 'Cache keys project',
      },
    })
  ).id
})

afterAll(async () => {
  await payload.delete({ collection: 'projects', id: projectId })
  await payload?.destroy()
})

const visitorInput = (value: string) =>
  calls.filter(({ args }) => JSON.stringify(args).includes(value))

describe('cache entries for unknown URLs', () => {
  it('writes none per unknown project or journal slug', async () => {
    calls.length = 0

    expect(await getProject('bot-guess-project', 'fr')).toBeNull()
    expect(await getJournalEntry('bot-guess-entry', 'fr')).toBeNull()

    expect(visitorInput('bot-guess')).toEqual([])
  })

  it('writes none per unknown path in the redirect lookup', async () => {
    calls.length = 0

    expect(await getRedirectDestination('/fr/bot-guess-page')).toBeNull()

    expect(visitorInput('bot-guess')).toEqual([])
  })

  it('still looks a published slug up', async () => {
    expect((await getProject('cache-keys-project', 'fr'))?.title).toBe('Cache keys project')
  })
})
