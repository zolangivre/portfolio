import { describe, expect, it } from 'vitest'

import {
  mcpCannotTrash,
  mcpGlobalWritesAreDrafts,
  mcpWritesAreDrafts,
} from '@/hooks/mcpWritesAreDrafts'

type Hook = typeof mcpWritesAreDrafts | typeof mcpGlobalWritesAreDrafts | typeof mcpCannotTrash

const run = (hook: Hook, operation: string, payloadAPI: string, args: Record<string, unknown>) =>
  (hook as (input: unknown) => unknown)({ args, operation, req: { payloadAPI } }) as Record<
    string,
    unknown
  >

describe.each([
  ['collections', mcpWritesAreDrafts],
  ['globals', mcpGlobalWritesAreDrafts],
] as const)('MCP writes on %s', (_label, hook) => {
  it.each(['create', 'update'])('turns an MCP %s into a draft save', (operation) => {
    const args = { data: { _status: 'published', title: 'From Claude' }, draft: false }

    const result = run(hook, operation, 'MCP', args)

    expect(result.draft).toBe(true)
    expect(result.data).toEqual({ _status: 'draft', title: 'From Claude' })
  })

  it('does not change the arguments it was given', () => {
    const args = { data: { _status: 'published' }, draft: false }

    run(hook, 'update', 'MCP', args)

    expect(args).toEqual({ data: { _status: 'published' }, draft: false })
  })

  it('leaves an MCP read alone', () => {
    const args = { draft: false }

    expect(run(hook, 'read', 'MCP', args)).toBe(args)
  })

  it.each(['local', 'REST', 'GraphQL'])('leaves a %s write alone', (payloadAPI) => {
    const args = { data: { _status: 'published' }, draft: false }

    expect(run(hook, 'update', payloadAPI, args)).toBe(args)
  })

  it('handles a write without data', () => {
    expect(run(hook, 'update', 'MCP', { draft: false })).toEqual({ data: undefined, draft: true })
  })
})

describe('trashing through MCP', () => {
  it('drops deletedAt from an MCP write on a collection with drafts', () => {
    const result = run(mcpWritesAreDrafts, 'update', 'MCP', {
      data: { deletedAt: '2026-01-01T00:00:00.000Z', title: 'x' },
    })

    expect(result.data).toEqual({ _status: 'draft', title: 'x' })
  })

  it.each(['create', 'update'])(
    'drops deletedAt from an MCP %s on a collection without drafts',
    (operation) => {
      const args = { data: { deletedAt: '2026-01-01T00:00:00.000Z', name: 'React' } }

      const result = run(mcpCannotTrash, operation, 'MCP', args)

      expect(result.data).toEqual({ name: 'React' })
      expect(result.draft).toBeUndefined()
      expect(args.data.deletedAt).toBeDefined()
    },
  )

  it('leaves an editor in the admin free to trash', () => {
    const args = { data: { deletedAt: '2026-01-01T00:00:00.000Z' } }

    expect(run(mcpCannotTrash, 'update', 'REST', args)).toBe(args)
  })

  it('handles an MCP write without data', () => {
    expect(run(mcpCannotTrash, 'update', 'MCP', {})).toEqual({ data: undefined })
  })
})

describe('ordering through MCP', () => {
  it('drops _order from an MCP write, with or without drafts', () => {
    expect(
      run(mcpWritesAreDrafts, 'update', 'MCP', { data: { _order: 'a0', title: 'x' } }).data,
    ).toEqual({
      _status: 'draft',
      title: 'x',
    })
    expect(
      run(mcpCannotTrash, 'update', 'MCP', { data: { _order: 'a0', name: 'x' } }).data,
    ).toEqual({
      name: 'x',
    })
  })
})
