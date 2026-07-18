import type { Setting } from '@/payload-types'

import { CursorTrail } from './CursorTrail'
import { CustomCursor } from './CustomCursor'

type CursorEffect = NonNullable<Setting['theme']>['cursorEffect']

export function CursorEffects({ effect }: { effect?: CursorEffect }) {
  if (effect === 'trail') {
    return <CursorTrail />
  }

  return <CustomCursor />
}
