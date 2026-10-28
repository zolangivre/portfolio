import type { CollectionBeforeOperationHook, GlobalBeforeOperationHook } from 'payload'

/**
 * What Claude writes through MCP is a draft, never a publication.
 *
 * The MCP plugin runs its tools through the Local API with a request marked
 * `payloadAPI: 'MCP'`, and lets the client pick `draft`. Here the operation
 * itself is turned into a draft save before Payload reads its arguments:
 * the published version — what the site shows — stays as it is, and the
 * editor reviews the draft (Live Preview) and publishes it. Forcing only
 * `_status` would not do: a non-draft save writes the published row, so it
 * would unpublish the document instead.
 */
type Args = { data?: Record<string, unknown>; draft?: boolean } & Record<string, unknown>

/**
 * Fields an MCP write may not set, dropped from every one of them:
 * - `deletedAt`: MCP gets no delete tool, but trash makes it an ordinary
 *   field an update could set — on a whole collection at once, with `where`.
 *   Only an editor in the admin trashes.
 * - `_order`: on a draft it would reach the live order anyway (syncDraftOrder
 *   copies a draft's order onto the published row), skipping review.
 *   Reordering stays a drag and drop in the admin.
 */
const withoutSystemFields = (data: Args['data']) => {
  if (!data) return data

  const { _order: _ignoredOrder, deletedAt: _ignoredDeletedAt, ...rest } = data

  return rest
}

const asDraft = (args: Args): Args => ({
  ...args,
  data: args.data ? { ...withoutSystemFields(args.data), _status: 'draft' } : args.data,
  draft: true,
})

const isMcpWrite = (operation: string, payloadAPI: string | undefined) =>
  payloadAPI === 'MCP' && (operation === 'create' || operation === 'update')

export const mcpWritesAreDrafts: CollectionBeforeOperationHook = ({ args, operation, req }) =>
  isMcpWrite(operation, req.payloadAPI) ? (asDraft(args as Args) as typeof args) : args

export const mcpGlobalWritesAreDrafts: GlobalBeforeOperationHook = ({ args, operation, req }) =>
  isMcpWrite(operation, req.payloadAPI) ? asDraft(args as Args) : args

/** For the collections without drafts: MCP writes go live, but never trash. */
export const mcpCannotTrash: CollectionBeforeOperationHook = ({ args, operation, req }) =>
  isMcpWrite(operation, req.payloadAPI)
    ? ({ ...args, data: withoutSystemFields((args as Args).data) } as typeof args)
    : args
