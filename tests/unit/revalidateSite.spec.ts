import { revalidateTag } from 'next/cache'
import { describe, expect, it, vi } from 'vitest'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
  revalidateGlobalAfterChange,
} from '@/hooks/revalidateSite'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

type Visibility = 'public' | 'private' | undefined

const afterChange = ({
  collection = 'projects',
  context = {},
  operation,
  now,
  before,
}: {
  collection?: string
  context?: Record<string, unknown>
  operation: 'create' | 'update'
  now?: Visibility
  before?: Visibility
}) => {
  const doc = { id: 1, visibility: now }

  const returned = revalidateCollectionAfterChange({
    collection: { slug: collection },
    context,
    doc,
    operation,
    previousDoc: operation === 'update' ? { id: 1, visibility: before } : undefined,
  } as never)

  expect(returned).toBe(doc)
}

describe('revalidateCollectionAfterChange', () => {
  it.each<[string, 'create' | 'update', Visibility, Visibility, boolean]>([
    ['creating a public doc', 'create', 'public', undefined, true],
    ['creating a private doc', 'create', 'private', undefined, false],
    ['editing a public doc', 'update', 'public', 'public', true],
    ['editing a doc that stays private', 'update', 'private', 'private', false],
    ['hiding a public doc', 'update', 'private', 'public', true],
    ['publishing a private doc', 'update', 'public', 'private', true],
    ['editing a doc without visibility', 'update', undefined, undefined, true],
  ])('%s → revalidates: %s', (_label, operation, now, before, expected) => {
    afterChange({ before, now, operation })

    if (expected) {
      expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('projects', { expire: 0 })
    } else {
      expect(revalidateTag).not.toHaveBeenCalled()
    }
  })

  it('skips a freshly uploaded media file', () => {
    afterChange({ collection: 'media', operation: 'create' })

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates when an existing media file changes', () => {
    afterChange({ collection: 'media', operation: 'update' })

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('media', { expire: 0 })
  })

  it('stays quiet for maintenance scripts', () => {
    afterChange({ context: { disableRevalidate: true }, now: 'public', operation: 'update' })

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('survives running outside a Next request (scripts, migrate)', () => {
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error('Invariant: static generation store missing')
    })

    expect(() => afterChange({ now: 'public', operation: 'update' })).not.toThrow()
  })
})

describe('revalidateCollectionAfterDelete', () => {
  const afterDelete = (visibility: Visibility, context = {}) => {
    const doc = { id: 1, visibility }

    expect(
      revalidateCollectionAfterDelete({
        collection: { slug: 'journal' },
        context,
        doc,
      } as never),
    ).toBe(doc)
  }

  it('revalidates when a public doc is deleted', () => {
    afterDelete('public')

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('journal', { expire: 0 })
  })

  it('skips an already-private doc', () => {
    afterDelete('private')

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('stays quiet for maintenance scripts', () => {
    afterDelete('public', { disableRevalidate: true })

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
