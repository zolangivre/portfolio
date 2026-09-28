import { describe, expect, it } from 'vitest'

import { readPublicOrAuthenticated } from '@/lib/access'

// The behaviour through Payload is covered in tests/int/access.int.spec.ts;
// this pins the rule itself.
describe('readPublicOrAuthenticated', () => {
  it('lets an editor read everything', () => {
    expect(readPublicOrAuthenticated({ req: { user: { id: 1 } } } as never)).toBe(true)
  })

  it('narrows a visitor to public documents', () => {
    expect(readPublicOrAuthenticated({ req: { user: null } } as never)).toEqual({
      visibility: { equals: 'public' },
    })
  })
})
