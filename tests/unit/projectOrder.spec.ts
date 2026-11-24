import { describe, expect, it } from 'vitest'

import { featuredFirst } from '@/lib/projectOrder'

describe('featuredFirst', () => {
  it('puts the featured projects first and keeps the admin order within each group', () => {
    const projects: { featured?: boolean | null; slug: string }[] = [
      { slug: 'a' },
      { featured: true, slug: 'b' },
      { featured: false, slug: 'c' },
      { featured: true, slug: 'd' },
      { featured: null, slug: 'e' },
    ]

    expect(featuredFirst(projects).map((project) => project.slug)).toEqual([
      'b',
      'd',
      'a',
      'c',
      'e',
    ])
  })

  it('leaves the list as it is when nothing, or everything, is featured', () => {
    const none: { featured?: boolean; slug: string }[] = [{ slug: 'a' }, { slug: 'b' }]
    const all = [
      { featured: true, slug: 'a' },
      { featured: true, slug: 'b' },
    ]

    expect(featuredFirst(none)).toEqual(none)
    expect(featuredFirst(all)).toEqual(all)
  })
})
