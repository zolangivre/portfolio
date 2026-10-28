import { describe, expect, it, vi } from 'vitest'

import {
  canRunJobs,
  readPublishedOrAuthenticated,
  readPublishedUntrashedOrAuthenticated,
  readUntrashedOrAuthenticated,
} from '@/lib/access'

// The behaviour through Payload is covered in tests/int/access.int.spec.ts;
// this pins the rule itself.
describe('readPublishedOrAuthenticated', () => {
  it('lets an editor read everything, drafts included', () => {
    expect(readPublishedOrAuthenticated({ req: { user: { id: 1 } } } as never)).toBe(true)
  })

  it('narrows a visitor to published documents', () => {
    expect(readPublishedOrAuthenticated({ req: { user: null } } as never)).toEqual({
      _status: { equals: 'published' },
    })
  })
})

// `canRunJobs` backs `jobs.access.run` in payload.config.ts, which guards
// /api/payload-jobs/run — the endpoint the Vercel cron calls. The wiring is
// checked in tests/int/drafts.int.spec.ts.
describe('canRunJobs', () => {
  const call = (user: unknown, authorization?: string) =>
    canRunJobs({
      req: {
        headers: new Headers(authorization === undefined ? {} : { authorization }),
        user,
      },
    } as never)

  it('lets a logged-in editor run the jobs', () => {
    vi.stubEnv('CRON_SECRET', 's3cret')

    expect(call({ id: 1 })).toBe(true)
  })

  it('lets the cron in with the right bearer token', () => {
    vi.stubEnv('CRON_SECRET', 's3cret')

    expect(call(null, 'Bearer s3cret')).toBe(true)
  })

  it('refuses an anonymous call without a token', () => {
    vi.stubEnv('CRON_SECRET', 's3cret')

    expect(call(null)).toBe(false)
  })

  it.each(['Bearer wrong!', 'Bearer s3cret-and-more', 'Bearer', 's3cret', 'bearer s3cret'])(
    'refuses the wrong token %j',
    (header) => {
      vi.stubEnv('CRON_SECRET', 's3cret')

      expect(call(null, header)).toBe(false)
    },
  )

  it('refuses everyone but editors when CRON_SECRET is not set', () => {
    vi.stubEnv('CRON_SECRET', '')

    expect(call(null, 'Bearer ')).toBe(false)
    expect(call(null, 'Bearer undefined')).toBe(false)
    expect(call({ id: 1 })).toBe(true)
  })
})

describe('readUntrashedOrAuthenticated', () => {
  it('lets an editor read everything, the trash included', () => {
    expect(readUntrashedOrAuthenticated({ req: { user: { id: 1 } } } as never)).toBe(true)
  })

  it('keeps the trash from a visitor', () => {
    expect(readUntrashedOrAuthenticated({ req: { user: null } } as never)).toEqual({
      deletedAt: { exists: false },
    })
  })
})

describe('readPublishedUntrashedOrAuthenticated', () => {
  it('lets an editor read everything', () => {
    expect(readPublishedUntrashedOrAuthenticated({ req: { user: { id: 1 } } } as never)).toBe(true)
  })

  it('gives a visitor what is published and not in the trash', () => {
    expect(readPublishedUntrashedOrAuthenticated({ req: { user: null } } as never)).toEqual({
      _status: { equals: 'published' },
      deletedAt: { exists: false },
    })
  })
})
