import { describe, expect, it } from 'vitest'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
  revalidateGlobalAfterChange,
} from '@/hooks/revalidateSite'
import { cacheTags } from '@/lib/cache'
import configPromise from '@/payload.config'

/**
 * Freshness hangs on two halves agreeing: the queries declare cache tags, and
 * the revalidate hooks fire tags named after the collection or global slug.
 * If either half forgets a slug, edits to it stay invisible on the site until
 * the 24h fallback — with nothing failing anywhere. This keeps them in step.
 */

const config = await configPromise

const tags = new Set<string>(Object.values(cacheTags))

const hooked: string[] = [
  ...config.collections
    .filter((collection) =>
      collection.hooks?.afterChange?.includes(revalidateCollectionAfterChange),
    )
    .map((collection) => collection.slug),
  ...config.globals
    .filter((global) => global.hooks?.afterChange?.includes(revalidateGlobalAfterChange))
    .map((global) => global.slug),
]

describe('cache tags and revalidate hooks', () => {
  it('name only real collections and globals', () => {
    const slugs = new Set<string>([
      ...config.collections.map((collection) => collection.slug),
      ...config.globals.map((global) => global.slug),
    ])

    expect([...tags].filter((tag) => !slugs.has(tag))).toEqual([])
  })

  it('revalidate every collection and global a query depends on', () => {
    expect([...tags].filter((tag) => !hooked.includes(tag))).toEqual([])
  })

  // A hook firing a tag no query declares means a query populates that
  // collection without saying so — which is how edits to `videos` went
  // unseen on project pages.
  it('declare a tag for every collection and global that revalidates', () => {
    expect(hooked.filter((slug) => !tags.has(slug))).toEqual([])
  })

  it('revalidate on delete as well as on change', () => {
    const missing = config.collections
      .filter((collection) => tags.has(collection.slug))
      .filter(
        (collection) => !collection.hooks?.afterDelete?.includes(revalidateCollectionAfterDelete),
      )
      .map((collection) => collection.slug)

    expect(missing).toEqual([])
  })
})
