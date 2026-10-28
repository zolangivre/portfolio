import { generateKeyBetween } from 'payload/shared'
import { revalidateTag } from 'next/cache'
import { describe, expect, it, vi } from 'vitest'

import { prependToOrder, syncDraftOrder } from '@/hooks/prependToOrder'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const find = vi.fn()
const req = { payload: { find } }

const run = async ({
  collection = 'projects',
  data,
  operation,
}: {
  collection?: string
  data: Record<string, unknown>
  operation: 'create' | 'update'
}) => {
  await prependToOrder({ collection: { slug: collection }, data, operation, req } as never)

  return data
}

describe('prependToOrder', () => {
  it('on create, puts the new document before the current first one', async () => {
    find.mockResolvedValue({ docs: [{ _order: 'a0', id: 1 }] })

    const data = await run({ data: { title: 'New' }, operation: 'create' })

    expect(data._order).toBe(generateKeyBetween(null, 'a0'))
    expect((data._order as string) < 'a0').toBe(true)
  })

  it('looks the first document up in order, with the same request', async () => {
    find.mockResolvedValue({ docs: [{ _order: 'a0', id: 1 }] })

    await run({ collection: 'journal', data: {}, operation: 'create' })

    expect(find).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        collection: 'journal',
        limit: 1,
        req,
        sort: '_order',
        where: { _order: { exists: true } },
      }),
    )
  })

  it('on create in an empty collection, picks the first key', async () => {
    find.mockResolvedValue({ docs: [] })

    const data = await run({ data: {}, operation: 'create' })

    expect(data._order).toBe(generateKeyBetween(null, null))
  })

  it('on create, leaves an explicit _order alone', async () => {
    const data = await run({ data: { _order: 'a5' }, operation: 'create' })

    expect(data._order).toBe('a5')
    expect(find).not.toHaveBeenCalled()
  })

  it('on update, changes nothing', async () => {
    const data = await run({ data: { title: 'Edited' }, operation: 'update' })

    expect(data).toEqual({ title: 'Edited' })
    expect(find).not.toHaveBeenCalled()
  })
})

describe('syncDraftOrder', () => {
  const sync = async (doc: Record<string, unknown>, main: unknown) => {
    const findByID = vi.fn().mockResolvedValue(main)
    const updateOne = vi.fn()
    const request = { payload: { db: { updateOne }, findByID } }

    const returned = await syncDraftOrder({
      collection: { slug: 'projects' },
      doc,
      req: request,
    } as never)

    expect(returned).toBe(doc)

    return { findByID, request, updateOne }
  }

  it("copies a draft's new order onto a published main row, and revalidates", async () => {
    const { request, updateOne } = await sync(
      { _order: 'a5', _status: 'draft', id: 1 },
      { _order: 'a1', _status: 'published', id: 1 },
    )

    expect(updateOne).toHaveBeenCalledExactlyOnceWith({
      collection: 'projects',
      data: { _order: 'a5' },
      id: 1,
      req: request,
    })
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('projects', { expire: 0 })
  })

  it('copies it onto an unpublished main row without revalidating', async () => {
    const { updateOne } = await sync(
      { _order: 'a5', _status: 'draft', id: 1 },
      { _order: 'a1', _status: 'draft', id: 1 },
    )

    expect(updateOne).toHaveBeenCalledOnce()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it.each([
    ['a published save', { _order: 'a5', _status: 'published', id: 1 }, undefined],
    ['a draft without order', { _status: 'draft', id: 1 }, undefined],
    ['a draft whose order matches', { _order: 'a1', _status: 'draft', id: 1 }, { _order: 'a1' }],
    ['a document that is gone', { _order: 'a5', _status: 'draft', id: 1 }, null],
  ])('leaves %s alone', async (_label, doc, main) => {
    const { updateOne } = await sync(doc, main)

    expect(updateOne).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
