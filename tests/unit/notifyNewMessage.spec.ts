import { beforeEach, describe, expect, it, vi } from 'vitest'

import { notifyNewMessage } from '@/hooks/notifyNewMessage'

const fetchMock = vi.fn()

const logger = { error: vi.fn(), warn: vi.fn() }
const findGlobal = vi.fn()

const doc = { email: 'visitor@example.com', id: 1, message: 'Hello!', name: 'Visitor' }

const notify = async (overrides: { operation?: 'create' | 'update'; doc?: object } = {}) => {
  const input = overrides.doc ?? doc

  const returned = await notifyNewMessage({
    doc: input,
    operation: overrides.operation ?? 'create',
    req: { payload: { findGlobal, logger } },
  } as never)

  expect(returned).toBe(input)
}

const sentBody = () => JSON.parse(fetchMock.mock.calls[0]![1].body)

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('CONTACT_NOTIFICATION_FROM', 'portfolio@example.com')
  vi.stubEnv('CONTACT_NOTIFICATION_TO', 'owner@example.com')
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
})

describe('notifyNewMessage', () => {
  it('sends the message to Resend', async () => {
    await notify()

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer re_test' }),
        method: 'POST',
      }),
    )
    expect(sentBody()).toMatchObject({
      from: 'portfolio@example.com',
      reply_to: 'visitor@example.com',
      subject: 'Nouveau message de Visitor',
      text: 'Visitor <visitor@example.com>\n\nHello!',
      to: ['owner@example.com'],
    })
  })

  it('only fires on create', async () => {
    await notify({ operation: 'update' })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is inert without an API key', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    await notify()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('warns and skips without a sender', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_FROM', '')

    await notify()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('falls back to the contact email from Global Settings', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_TO', '')
    findGlobal.mockResolvedValue({ contactEmail: 'settings@example.com' })

    await notify()

    expect(findGlobal).toHaveBeenCalledWith({ depth: 0, slug: 'settings' })
    expect(sentBody().to).toEqual(['settings@example.com'])
  })

  it('warns and skips when no recipient is configured anywhere', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_TO', '')
    findGlobal.mockResolvedValue({ contactEmail: null })

    await notify()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('escapes visitor input in the HTML body', async () => {
    await notify({
      doc: {
        ...doc,
        email: '"x"@example.com',
        message: 'Tom & Jerry <img src=x onerror=alert(1)>',
        name: '<script>alert(1)</script>',
      },
    })

    const { html } = sentBody()

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Tom &amp; Jerry &lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&quot;x&quot;@example.com')
  })

  // The message is already stored by the time this runs: a failed
  // notification must never turn into a failed submission.
  it('logs a rejection from Resend without throwing', async () => {
    fetchMock.mockResolvedValue(new Response('domain not verified', { status: 403 }))

    await notify()

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('403'))
  })

  it('logs a network failure without throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await notify()

    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('logs a failed settings lookup without throwing', async () => {
    vi.stubEnv('CONTACT_NOTIFICATION_TO', '')
    findGlobal.mockRejectedValue(new Error('connection lost'))

    await notify()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
