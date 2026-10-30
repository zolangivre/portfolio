import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { dropConsoleBreadcrumb, scrubEvent } from '@/lib/sentry'

// How Drizzle words a failed query, with a contact message's values.
const failedInsert =
  'Failed query: insert into "messages" ("name", "email", "message") values ($1, $2, $3)\n' +
  'params: Jeanne,jeanne@example.com,Bonjour, voici mon numéro'

const event = (overrides: Partial<ErrorEvent>) => overrides as ErrorEvent

describe('scrubEvent', () => {
  it('removes the SQL values from every exception, keeping the query', () => {
    const scrubbed = scrubEvent(
      event({
        exception: {
          values: [
            { type: 'DrizzleQueryError', value: failedInsert },
            { type: 'error', value: 'column "name" does not exist' },
            { type: 'Error' },
          ],
        },
      }),
    )

    const [drizzle, cause, empty] = scrubbed.exception!.values!
    expect(drizzle!.value).toBe(
      'Failed query: insert into "messages" ("name", "email", "message") values ($1, $2, $3)',
    )
    expect(cause!.value).toBe('column "name" does not exist')
    expect(empty!.value).toBeUndefined()
  })

  it('removes them from a plain message too', () => {
    expect(scrubEvent(event({ message: failedInsert })).message).not.toContain('jeanne@example.com')
  })

  it('drops the logged arguments and keeps the rest of the extras', () => {
    const scrubbed = scrubEvent(
      event({ extra: { arguments: ['Failed.', failedInsert], logger: 'console' } }),
    )

    expect(scrubbed.extra).toEqual({ logger: 'console' })
  })

  it('keeps only the method and URL of the request, and no user', () => {
    const scrubbed = scrubEvent(
      event({
        request: {
          cookies: { 'payload-token': 'secret' },
          data: 'name=Jeanne',
          env: { REMOTE_ADDR: '203.0.113.7' },
          headers: { 'x-forwarded-for': '203.0.113.7' },
          method: 'POST',
          url: 'https://www.zolangivre.com/fr',
        },
        user: { ip_address: '203.0.113.7' },
      }),
    )

    expect(scrubbed.request).toEqual({ method: 'POST', url: 'https://www.zolangivre.com/fr' })
    expect(scrubbed.user).toBeUndefined()
  })

  it('leaves an event with none of these alone', () => {
    const untouched = event({ level: 'error' })

    expect(scrubEvent(untouched)).toEqual({ level: 'error' })
  })
})

describe('dropConsoleBreadcrumb', () => {
  it('drops console lines and keeps the others', () => {
    const navigation = { category: 'navigation' }

    expect(dropConsoleBreadcrumb({ category: 'console', message: failedInsert })).toBeNull()
    expect(dropConsoleBreadcrumb(navigation)).toBe(navigation)
  })
})
