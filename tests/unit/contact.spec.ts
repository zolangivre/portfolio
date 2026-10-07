import { beforeEach, describe, expect, it, vi } from 'vitest'

import { submitContactForm } from '@/lib/actions/contact'
import { createMessage } from '@/lib/queries/messages'

vi.mock('@/lib/queries/messages', () => ({ createMessage: vi.fn() }))

const valid = { email: 'visitor@example.com', message: 'Hello there', name: 'Visitor' }

const submit = (fields: Record<string, string>) => {
  const formData = new FormData()

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value)
  }

  return submitContactForm({ success: false }, formData)
}

beforeEach(() => {
  vi.mocked(createMessage).mockResolvedValue({ success: true })
})

describe('submitContactForm', () => {
  it('saves a valid message, trimmed', async () => {
    const result = await submit({
      email: ' visitor@example.com ',
      message: '\nHello there ',
      name: ' Visitor',
    })

    expect(result).toEqual({ success: true })
    expect(createMessage).toHaveBeenCalledWith(valid)
  })

  it('reports success to a bot that filled the honeypot, without saving', async () => {
    expect(await submit({ ...valid, company: 'Spam Inc' })).toEqual({ success: true })
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('ignores a whitespace-only honeypot (autofill)', async () => {
    expect(await submit({ ...valid, company: '   ' })).toEqual({ success: true })
    expect(createMessage).toHaveBeenCalledOnce()
  })

  it.each(['name', 'email', 'message'] as const)('rejects a missing %s', async (field) => {
    const fields: Record<string, string> = { ...valid }
    delete fields[field]

    expect(await submit(fields)).toMatchObject({ error: 'missing-fields', field, success: false })
    expect(await submit({ ...valid, [field]: '   ' })).toMatchObject({
      error: 'missing-fields',
      field,
      success: false,
    })
    expect(createMessage).not.toHaveBeenCalled()
  })

  it.each(['plain', 'a@b', 'a b@example.com', '@example.com', 'visitor@'])(
    'rejects the malformed email %j',
    async (email) => {
      expect(await submit({ ...valid, email })).toMatchObject({
        error: 'invalid-email',
        field: 'email',
        success: false,
      })
    },
  )

  it('accepts every field at its limit', async () => {
    const atLimit = {
      email: `${'a'.repeat(242)}@example.com`,
      message: 'm'.repeat(5000),
      name: 'n'.repeat(120),
    }

    expect(await submit(atLimit)).toEqual({ success: true })
  })

  // Real visitors can't get here — the inputs carry the same maxLength — so
  // only a scripted post sees this, and the generic message is acceptable.
  it.each([
    ['name', 'n'.repeat(121)],
    ['email', `${'a'.repeat(243)}@example.com`],
    ['message', 'm'.repeat(5001)],
  ])('rejects an over-long %s as missing-fields', async (field, value) => {
    expect(await submit({ ...valid, [field]: value })).toMatchObject({
      error: 'missing-fields',
      field,
      success: false,
    })
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('reports a server error when the message could not be saved', async () => {
    vi.mocked(createMessage).mockResolvedValue({ success: false })

    expect(await submit(valid)).toEqual({
      error: 'server-error',
      field: undefined,
      success: false,
      values: valid,
    })
  })

  it('sends the trimmed input back on error, so the form can restore it', async () => {
    expect(await submit({ ...valid, email: ' nope ' })).toMatchObject({
      values: { ...valid, email: 'nope' },
    })
  })
})
