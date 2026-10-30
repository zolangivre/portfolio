import { describe, expect, it } from 'vitest'

import { neutralizeFormula } from '@/lib/csv'

describe('neutralizeFormula', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '\tcmd', '\rcmd', '＝1+1', '＋1', '－1', '＠SUM(1)'])(
    'quotes %j, which a spreadsheet would run',
    (value) => {
      expect(neutralizeFormula(value)).toBe(`'${value}`)
    },
  )

  it.each([
    [' =1+1', ` '=1+1`],
    ['\u00a0=1+1', `\u00a0'=1+1`],
    ['"=1+1"', `"'=1+1"`],
    ['\n=1+1', `\n'=1+1`],
  ])('quotes the formula behind the padding of %j', (value, expected) => {
    expect(neutralizeFormula(value)).toBe(expected)
  })

  // A French Excel splits a comma-separated file on semicolons and line breaks,
  // so each of these can open as a cell of its own.
  it.each([
    ['x;=1+1;y', `x;'=1+1;y`],
    ['x; =1+1', `x; '=1+1`],
    ['x\n=1+1', `x\n'=1+1`],
    ['x\r\n@SUM(1)', `x\r\n'@SUM(1)`],
    ['x\t+1', `x\t'+1`],
    ['x;"=1+1";y', `x;"'=1+1";y`],
    ['x;\u00a0=1+1', `x;\u00a0'=1+1`],
    ['x;\f=1+1', `x;\f'=1+1`],
    ['x;;\n ;=1+1', `x;;\n ;'=1+1`],
  ])('quotes the formula inside %j', (value, expected) => {
    expect(neutralizeFormula(value)).toBe(expected)
  })

  it('quotes every formula of a value, the first one included', () => {
    expect(neutralizeFormula('=1;=2\n=3')).toBe(`'=1;'=2\n'=3`)
  })

  it.each([
    'Bonjour',
    'zolan@test.local',
    'a = b',
    '',
    "l'été",
    'a;b',
    'Bonjour,\nÀ bientôt',
    '"citation"',
    ';;;',
  ])('leaves %j alone', (value) => {
    expect(neutralizeFormula(value)).toBe(value)
  })

  // Far past a field's 5,000 characters, so that a quadratic scan would show.
  it.each(['\t', ' \t', ';', '"\n'])('stays linear on a long run of %j', (run) => {
    const start = performance.now()
    neutralizeFormula(run.repeat(200_000))

    expect(performance.now() - start).toBeLessThan(500)
  })

  it.each([null, undefined, 42])('leaves %j alone, not being text', (value) => {
    expect(neutralizeFormula(value)).toBe(value)
  })
})
