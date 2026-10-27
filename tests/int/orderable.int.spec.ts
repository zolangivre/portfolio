import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { textToLexicalParagraphs } from '@/lib/richText'
import configPromise from '@/payload.config'

/**
 * Orderable collections: a new document arrives first, and editing a
 * document never moves it. Exercised on `projects`; the hook is shared by
 * the six orderable collections.
 */

const config = await configPromise

let payload: Payload
const createdIds: number[] = []

const createProject = async (slug: string) => {
  const doc = await payload.create({
    collection: 'projects',
    data: {
      _status: 'published',
      description: textToLexicalParagraphs('Description.'),
      shortDescription: 'Short description.',
      slug,
      title: slug,
    },
  })
  createdIds.push(doc.id)
  return doc
}

const orderedSlugs = async () => {
  const { docs } = await payload.find({
    collection: 'projects',
    limit: 0,
    sort: '_order',
    where: { slug: { like: 'orderable-' } },
  })
  return docs.map((doc) => doc.slug)
}

const orderKey = async (id: number) => {
  const doc = (await payload.findByID({ collection: 'projects', id })) as { _order?: string }
  return doc._order
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  for (const id of createdIds) {
    await payload.delete({ collection: 'projects', id })
  }
  await payload?.destroy()
})

describe('orderable projects', () => {
  it('lists a document created later before the earlier ones', async () => {
    await createProject('orderable-first')
    await createProject('orderable-second')
    await createProject('orderable-third')

    expect(await orderedSlugs()).toEqual(['orderable-third', 'orderable-second', 'orderable-first'])
  })

  it('gives every new document an _order key', async () => {
    const [first] = createdIds
    expect(await orderKey(first!)).toEqual(expect.any(String))
    expect(await orderKey(first!)).not.toBe('')
  })

  it('keeps _order and position when a document is updated', async () => {
    const firstId = createdIds[0]!
    const before = await orderKey(firstId)

    await payload.update({
      collection: 'projects',
      data: { title: 'Orderable first, edited' },
      id: firstId,
    })

    expect(await orderKey(firstId)).toBe(before)
    expect(await orderedSlugs()).toEqual(['orderable-third', 'orderable-second', 'orderable-first'])
  })
})
