import { describe, expect, it } from 'vitest'

import { contactFieldProblem } from '@/lib/contactValidation'

describe('contactFieldProblem', () => {
  it.each(['name', 'email', 'message'] as const)('flags an empty %s', (field) => {
    expect(contactFieldProblem(field, '')).toBe(field)
  })

  it('treats whitespace alone as empty', () => {
    expect(contactFieldProblem('message', '   \n\t')).toBe('message')
  })

  it.each(['zolan', 'zolan@', 'zolan@example', 'zo lan@example.com'])(
    'flags a malformed email: %s',
    (value) => {
      expect(contactFieldProblem('email', value)).toBe('emailFormat')
    },
  )

  it('accepts a well-formed email, around spaces included', () => {
    expect(contactFieldProblem('email', '  zolan@example.com ')).toBeNull()
  })

  // Only the email has a format: any other text is a valid name or message.
  it.each([
    ['name', 'Zolan'],
    ['message', 'not an email'],
  ] as const)('accepts any non-empty %s', (field, value) => {
    expect(contactFieldProblem(field, value)).toBeNull()
  })
})
