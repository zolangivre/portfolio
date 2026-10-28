import { describe, expect, it } from 'vitest'

import { presentTechnologies } from '@/components/ui/TechChip'
import type { Technology } from '@/payload-types'

// One helper behind the three technology lists (project card, project page,
// experience timeline): a technology in the trash comes back as `null`.
describe('presentTechnologies', () => {
  const react = { id: 1, name: 'React' } as Technology

  it('drops trashed (null) entries and keeps the rest in order', () => {
    expect(presentTechnologies([null, react, 3, null])).toEqual([react, 3])
  })

  it('returns an empty list for a missing relationship', () => {
    expect(presentTechnologies(undefined)).toEqual([])
    expect(presentTechnologies(null)).toEqual([])
  })
})
