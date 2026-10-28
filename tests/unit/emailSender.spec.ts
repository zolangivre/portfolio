import { describe, expect, it } from 'vitest'

import { parseSender } from '@/lib/emailSender'

describe('parseSender', () => {
  it.each([
    [
      'Portfolio <contact@mail.zolangivre.com>',
      { address: 'contact@mail.zolangivre.com', name: 'Portfolio' },
    ],
    [
      '"Portfolio <contact@mail.zolangivre.com>"',
      { address: 'contact@mail.zolangivre.com', name: 'Portfolio' },
    ],
    ['"Zolan Givre" <zolan@example.com>', { address: 'zolan@example.com', name: 'Zolan Givre' }],
    ['<contact@example.com>', { address: 'contact@example.com', name: 'Portfolio' }],
    ['  contact@example.com  ', { address: 'contact@example.com', name: 'Portfolio' }],
  ])('%s', (value, expected) => {
    expect(parseSender(value)).toEqual(expected)
  })

  it('returns null when there is no address', () => {
    for (const value of [undefined, '', '   ', 'Portfolio', 'Portfolio <not an address>']) {
      expect(parseSender(value)).toBeNull()
    }
  })

  it('takes another fallback name', () => {
    expect(parseSender('a@b.co', 'Zolan')).toEqual({ address: 'a@b.co', name: 'Zolan' })
  })
})
