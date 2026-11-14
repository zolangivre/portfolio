import { describe, expect, it } from 'vitest'

import { withVerifiedTls } from '@/lib/databaseUrl'

// The shape of a Neon connection string.
const neon = (sslmode: string) =>
  `postgresql://user:p%40ss@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=${sslmode}&channel_binding=require`

describe('withVerifiedTls', () => {
  it.each(['prefer', 'require', 'verify-ca'])(
    'writes sslmode=%s as verify-full, which pg already applies',
    (mode) => {
      expect(withVerifiedTls(neon(mode))).toBe(neon('verify-full'))
    },
  )

  it('finds sslmode after other parameters', () => {
    expect(withVerifiedTls('postgres://h/db?connect_timeout=10&sslmode=require')).toBe(
      'postgres://h/db?connect_timeout=10&sslmode=verify-full',
    )
  })

  it.each([
    neon('verify-full'),
    neon('disable'),
    'postgres://postgres:postgres@127.0.0.1:5432/payload-portfolio',
    '',
  ])('leaves %s alone', (url) => {
    expect(withVerifiedTls(url)).toBe(url)
  })

  it('does not touch a parameter that merely ends in sslmode', () => {
    const url = 'postgres://h/db?xsslmode=require'
    expect(withVerifiedTls(url)).toBe(url)
  })
})
