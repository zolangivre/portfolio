import { describe, expect, it } from 'vitest'

import { neutralizeFormula } from '@/lib/csv'

describe('neutralizeFormula', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '\tcmd', '\rcmd', '＝1+1', '＋1', '－1', '＠SUM(1)'])(
    'quotes %j, which a spreadsheet would run',
    (value) => {
      expect(neutralizeFormula(value)).toBe(`'${value}`)
    },
  )

  it('quotes a formula behind leading spaces', () => {
    expect(neutralizeFormula(' =1+1')).toBe(`' =1+1`)
  })

  // A French Excel splits a comma-separated file on semicolons and line breaks,
  // so each of these can open as a cell of its own.
  it.each([
    ['x;=1+1;y', `x;'=1+1;y`],
    ['x; =1+1', `x; '=1+1`],
    ['x\n=1+1', `x\n'=1+1`],
    ['x\r\n@SUM(1)', `x\r\n'@SUM(1)`],
    ['x\t+1', `x\t'+1`],
  ])('quotes the formula inside %j', (value, expected) => {
    expect(neutralizeFormula(value)).toBe(expected)
  })

  it('quotes every formula of a value, the first one included', () => {
    expect(neutralizeFormula('=1;=2\n=3')).toBe(`'=1;'=2\n'=3`)
  })

  it.each(['Bonjour', 'zolan@test.local', 'a = b', '', "l'été", 'a;b', 'Bonjour,\nÀ bientôt'])(
    'leaves %j alone',
    (value) => {
      expect(neutralizeFormula(value)).toBe(value)
    },
  )

  it.each([null, undefined, 42])('leaves %j alone, not being text', (value) => {
    expect(neutralizeFormula(value)).toBe(value)
  })
})
