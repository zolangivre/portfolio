import { describe, expect, it } from 'vitest'

import { neutralizeFormula } from '@/lib/csv'

describe('neutralizeFormula', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '\tcmd', '\rcmd', '＝1+1', '＋1', '－1', '＠SUM(1)'])(
    'quotes %j, which a spreadsheet would run',
    (value) => {
      expect(neutralizeFormula(value)).toBe(`'${value}`)
    },
  )

  it.each(['Bonjour', 'zolan@test.local', 'a = b', '', "l'été"])('leaves %j alone', (value) => {
    expect(neutralizeFormula(value)).toBe(value)
  })

  it.each([null, undefined, 42])('leaves %j alone, not being text', (value) => {
    expect(neutralizeFormula(value)).toBe(value)
  })
})
