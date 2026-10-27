import { generateKeyBetween } from 'payload/shared'
import { describe, expect, it, vi } from 'vitest'

import { prependToOrder } from '@/hooks/prependToOrder'

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
