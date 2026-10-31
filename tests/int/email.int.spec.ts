import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Payload's own emails, the admin's "Mot de passe oublié" first, go out
 * through Resend once its key and the contact sender are set. Resend's API is
 * faked: the test reads what would have been sent.
 */

// Set before the config is imported: the adapter is chosen at import time.
Object.assign(process.env, {
  CONTACT_NOTIFICATION_FROM: 'Portfolio <contact@mail.example.com>',
  RESEND_API_KEY: 're_email_int_test',
})
const { default: configPromise } = await import('@/payload.config')

const USER = { email: 'email-reset@test.local', password: 'email-reset' }

const sent: { body: Record<string, unknown>; headers: Headers }[] = []
const realFetch = globalThis.fetch

let payload: Payload
let userId: number

beforeAll(async () => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === 'https://api.resend.com/emails') {
      sent.push({ body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) })
      return new Response(JSON.stringify({ id: `email-${sent.length}` }), { status: 200 })
    }
    return realFetch(input, init)
  })

  payload = await getPayload({ config: configPromise })
  userId = (await payload.create({ collection: 'users', data: USER })).id
})

afterAll(async () => {
  await payload.delete({ collection: 'users', id: userId })
  await payload?.destroy()
  vi.unstubAllGlobals()
})

describe('the forgot-password email', () => {
  it('is sent through Resend, from the contact sender, with a reset link', async () => {
    await payload.forgotPassword({ collection: 'users', data: { email: USER.email } })

    expect(sent).toHaveLength(1)
    const [{ body, headers }] = sent as [(typeof sent)[number]]
    expect(headers.get('Authorization')).toBe('Bearer re_email_int_test')
    expect(body.from).toBe('"Portfolio" <contact@mail.example.com>')
    expect(body.to).toBe(USER.email)
    expect(String(body.html)).toMatch(/\/admin\/reset\/[\w-]+/)
  })
})
