import { describe, expect, it } from 'vitest'

import { refuseGlobalUnpublishSchedule } from '@/collections/drafts'

const run = (data: Record<string, unknown>, operation: 'create' | 'update' = 'create') =>
  refuseGlobalUnpublishSchedule({ data, operation } as never)

describe('refuseGlobalUnpublishSchedule', () => {
  it('refuses a scheduled unpublish of a global', () => {
    expect(() =>
      run({ input: { global: 'hero', type: 'unpublish' }, taskSlug: 'schedulePublish' }),
    ).toThrow('Un global ne se dépublie pas')
  })

  it.each([
    ['a scheduled publish of a global', { input: { global: 'hero', type: 'publish' } }],
    [
      'a scheduled unpublish of a document',
      { input: { doc: { relationTo: 'projects', value: '1' }, type: 'unpublish' } },
    ],
  ])('lets %s through', (_label, job) => {
    const data = { ...job, taskSlug: 'schedulePublish' }

    expect(run(data)).toBe(data)
  })

  it('leaves other tasks and updates of running jobs alone', () => {
    const other = { input: { global: 'hero', type: 'unpublish' }, taskSlug: 'inline' }
    const running = { input: { global: 'hero', type: 'unpublish' }, taskSlug: 'schedulePublish' }

    expect(run(other)).toBe(other)
    expect(run(running, 'update')).toBe(running)
  })
})
