import { revalidateTag } from 'next/cache'
import { describe, expect, it, vi } from 'vitest'

import {
  rememberLiveState,
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
  revalidateGlobalAfterChange,
} from '@/hooks/revalidateSite'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

type Status = 'published' | 'draft' | undefined

/** A request whose main-row lookup answers with `mainStatus`. */
const requestWithMainRow = (mainStatus: Status) => {
  const findByID = vi.fn().mockResolvedValue(mainStatus ? { id: 1, _status: mainStatus } : null)

  return { findByID, req: { payload: { findByID } } }
}

const afterChange = async ({
  collection = 'projects',
  context = {},
  operation,
  now,
  before,
  wasLive,
  liveAfter,
}: {
  collection?: string
  context?: Record<string, unknown>
  operation: 'create' | 'update'
  /** `_status` of the saved version. */
  now?: Status
  /** `_status` of the previous latest version. */
  before?: Status
  /** What rememberLiveState stored before the save; undefined = not registered. */
  wasLive?: boolean
  /** The main row's `_status` after the save. */
  liveAfter?: Status
}) => {
  const doc = { id: 1, _status: now }
  const { findByID, req } = requestWithMainRow(liveAfter)

  if (wasLive !== undefined) {
    context[`revalidate:wasLive:${collection}:1`] = wasLive
  }

  const returned = await revalidateCollectionAfterChange({
    collection: { slug: collection },
    context,
    doc,
    operation,
    previousDoc: operation === 'update' ? { id: 1, _status: before } : undefined,
    req,
  } as never)

  expect(returned).toBe(doc)

  return findByID
}

describe('revalidateCollectionAfterChange', () => {
  it.each<[string, 'create' | 'update', Status, Status, boolean | undefined, Status, boolean]>([
    ['creating a published doc', 'create', 'published', undefined, undefined, 'published', true],
    ['creating a draft', 'create', 'draft', undefined, undefined, 'draft', false],
    ['editing a published doc', 'update', 'published', 'published', true, 'published', true],
    [
      'autosaving a draft that was never published',
      'update',
      'draft',
      'draft',
      false,
      'draft',
      false,
    ],
    [
      'saving a draft over a published doc',
      'update',
      'draft',
      'published',
      true,
      'published',
      false,
    ],
    ['autosaving again over a published doc', 'update', 'draft', 'draft', true, 'published', false],
    ['unpublishing a published doc', 'update', 'draft', 'published', true, 'draft', true],
    // The case the version-based rule missed: the latest version is an
    // autosave draft, but the main row was live until this save.
    ['unpublishing after an autosave', 'update', 'draft', 'draft', true, 'draft', true],
    ['publishing a draft', 'update', 'published', 'draft', false, 'published', true],
    [
      'creating a doc of a collection without drafts',
      'create',
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    ],
    [
      'editing a doc of a collection without drafts',
      'update',
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    ],
  ])(
    '%s → revalidates: %s',
    async (_label, operation, now, before, wasLive, liveAfter, expected) => {
      await afterChange({ before, liveAfter, now, operation, wasLive })

      if (expected) {
        expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('projects', { expire: 0 })
      } else {
        expect(revalidateTag).not.toHaveBeenCalled()
      }
    },
  )

  it('falls back to the previous version when nothing was remembered', async () => {
    await afterChange({
      before: 'published',
      liveAfter: 'draft',
      now: 'draft',
      operation: 'update',
    })

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('projects', { expire: 0 })
  })

  it('reads the main row, with the same request, only for a draft that was live', async () => {
    const findByID = await afterChange({
      liveAfter: 'draft',
      now: 'draft',
      operation: 'update',
      wasLive: true,
    })

    expect(findByID).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ collection: 'projects', draft: false, id: 1 }),
    )

    const untouched = await afterChange({ now: 'published', operation: 'update', wasLive: true })

    expect(untouched).not.toHaveBeenCalled()
  })

  it('revalidates when the main row cannot be read after an unpublish-like save', async () => {
    const { req } = requestWithMainRow(undefined)
    const error = vi.fn()
    req.payload.findByID.mockRejectedValue(new Error('connection lost'))
    Object.assign(req.payload, { logger: { error } })
    const doc = { id: 1, _status: 'draft' }

    await revalidateCollectionAfterChange({
      collection: { slug: 'projects' },
      context: { 'revalidate:wasLive:projects:1': true },
      doc,
      operation: 'update',
      previousDoc: { id: 1, _status: 'draft' },
      req,
    } as never)

    expect(error).toHaveBeenCalledOnce()
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('projects', { expire: 0 })
  })

  it('skips a freshly uploaded media file', async () => {
    await afterChange({ collection: 'media', operation: 'create' })

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates when an existing media file changes', async () => {
    await afterChange({ collection: 'media', operation: 'update' })

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('media', { expire: 0 })
  })

  it('stays quiet for maintenance scripts', async () => {
    await afterChange({
      context: { disableRevalidate: true },
      now: 'published',
      operation: 'update',
    })

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('survives running outside a Next request (scripts, migrate)', async () => {
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error('Invariant: static generation store missing')
    })

    await expect(afterChange({ now: 'published', operation: 'update' })).resolves.toBeDefined()
  })
})

describe('rememberLiveState', () => {
  const remember = async ({
    context = {},
    mainStatus,
    operation,
  }: {
    context?: Record<string, unknown>
    mainStatus?: Status
    operation: 'create' | 'update'
  }) => {
    const { findByID, req } = requestWithMainRow(mainStatus)
    // Payload passes `req.context` as the hook's `context`.
    Object.assign(req, { context })
    const data = { title: 'Edited' }

    const returned = await rememberLiveState({
      collection: { slug: 'journal' },
      context,
      data,
      operation,
      originalDoc: operation === 'update' ? { id: 1 } : undefined,
      req,
    } as never)

    expect(returned).toBe(data)

    return { context, findByID }
  }

  it.each<[Status, boolean]>([
    ['published', true],
    ['draft', false],
    [undefined, false],
  ])('on update, remembers whether the main row is %s', async (mainStatus, expected) => {
    const { context, findByID } = await remember({ mainStatus, operation: 'update' })

    expect(context['revalidate:wasLive:journal:1']).toBe(expected)
    expect(findByID).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ collection: 'journal', draft: false, id: 1 }),
    )
  })

  it('skips the lookup for a publish, which always revalidates', async () => {
    const { req, findByID } = requestWithMainRow('published')
    const context = {}
    Object.assign(req, { context })

    await rememberLiveState({
      collection: { slug: 'journal' },
      context,
      data: { _status: 'published' },
      operation: 'update',
      originalDoc: { id: 1 },
      req,
    } as never)

    expect(findByID).not.toHaveBeenCalled()
    expect(context).toEqual({})
  })

  it('remembers nothing when the main row cannot be read', async () => {
    const { req, findByID } = requestWithMainRow('published')
    findByID.mockRejectedValue(new Error('connection lost'))
    const context = {}
    Object.assign(req, { context })
    Object.assign(req.payload, { logger: { error: vi.fn() } })

    await expect(
      rememberLiveState({
        collection: { slug: 'journal' },
        context,
        data: {},
        operation: 'update',
        originalDoc: { id: 1 },
        req,
      } as never),
    ).resolves.toEqual({})
    expect(context).toEqual({})
  })

  it('does nothing on create', async () => {
    const { context, findByID } = await remember({ operation: 'create' })

    expect(context).toEqual({})
    expect(findByID).not.toHaveBeenCalled()
  })

  it('does nothing for maintenance scripts', async () => {
    const { findByID } = await remember({
      context: { disableRevalidate: true },
      mainStatus: 'published',
      operation: 'update',
    })

    expect(findByID).not.toHaveBeenCalled()
  })
})

describe('revalidateCollectionAfterDelete', () => {
  const afterDelete = (status: Status, context = {}) => {
    const doc = { id: 1, _status: status }

    expect(
      revalidateCollectionAfterDelete({
        collection: { slug: 'journal' },
        context,
        doc,
      } as never),
    ).toBe(doc)
  }

  it('revalidates when a published doc is deleted', () => {
    afterDelete('published')

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('journal', { expire: 0 })
  })

  it('skips a draft', () => {
    afterDelete('draft')

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates when a doc of a collection without drafts is deleted', () => {
    afterDelete(undefined)

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('journal', { expire: 0 })
  })

  it('stays quiet for maintenance scripts', () => {
    afterDelete('published', { disableRevalidate: true })

    expect(revalidateTag).not.toHaveBeenCalled()
  })
})

describe('revalidateGlobalAfterChange', () => {
  const globalChange = (context = {}) => {
    const doc = { id: 1 }

    expect(revalidateGlobalAfterChange({ context, doc, global: { slug: 'hero' } } as never)).toBe(
      doc,
    )
  }

  it('revalidates the global by its slug', () => {
    globalChange()

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('hero', { expire: 0 })
  })

  it('stays quiet for maintenance scripts', () => {
    globalChange({ disableRevalidate: true })

    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
