import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * The database was built from the migrations alone. Here Drizzle compares it
 * with the schema the config expects, and lists the SQL it would run to close
 * the gap, without running it. Anything listed is a migration nobody wrote.
 *
 * `payload migrate:create` is broken in this repo (stale snapshots), and
 * reading every collection (schema.int.spec.ts) misses columns Payload only
 * writes, or adds on its own in an upgrade (3.90 added
 * `reset_password_requested_at` with no config change). This check catches
 * both, and its failure message is the SQL the missing migration needs.
 */

// Production runs with R2, and the storage plugin adds its own columns
// (`prefix`, `_objectkey`) to `media` and `videos`. Without a key the plugin
// is off and those columns would read as extra. Placeholders are enough: the
// plugin only shapes the schema at startup, nothing here uploads. They are
// set unconditionally, so a real key exported in the shell can never point
// this run at the production bucket.
Object.assign(process.env, {
  R2_ACCESS_KEY_ID: 'schema-drift-check',
  R2_ACCOUNT_ID: 'schema-drift-check',
  R2_BUCKET: 'schema-drift-check',
  R2_PUBLIC_URL: 'http://127.0.0.1/schema-drift-check',
  R2_SECRET_ACCESS_KEY: 'schema-drift-check',
})
const { default: configPromise } = await import('@/payload.config')
const config = await configPromise

/**
 * Column defaults are left out. Payload applies `defaultValue` itself when it
 * creates a document, so a database default only matters for rows written
 * outside Payload, and several were dropped on purpose
 * (20260716_110000_order_ascending_semantics). Counting them would also make
 * every change to a default text (rich text defaults are stored as JSON)
 * need a migration. A new column's default is still checked: it's part of
 * its `ADD COLUMN`. The pattern matches the whole statement, so one that
 * does anything besides changing a single default is still reported.
 */
const isDefaultOnly = (statement: string) =>
  /^ALTER TABLE "[^"]+" ALTER COLUMN "[^"]+" (SET DEFAULT [^;]*|DROP DEFAULT);?$/s.test(
    statement.trim(),
  )

/**
 * Postgres cuts identifiers to 63 bytes (NAMEDATALEN), and Drizzle doesn't
 * know it: a generated name past that length is stored cut, and the next
 * comparison asks to drop the cut constraint and add the full one — forever,
 * since adding it cuts it again. Such a pair is the same constraint. (The
 * first one: the settings versions' background photo FK, 64 characters.)
 */
const POSTGRES_MAX_IDENTIFIER = 63

const isTruncatedRename = (statement: string, statements: string[]) => {
  const drop = /^ALTER TABLE "([^"]+)" DROP CONSTRAINT "([^"]+)";?$/.exec(statement.trim())
  const add = /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)"/.exec(statement.trim())
  const [, table, name] = drop ?? add ?? []
  if (!table || !name) return false

  return statements.some((other) => {
    const pair = drop
      ? /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)"/.exec(other.trim())
      : /^ALTER TABLE "([^"]+)" DROP CONSTRAINT "([^"]+)";?$/.exec(other.trim())
    if (!pair || pair[1] !== table) return false
    const [full, cut] = drop ? [pair[2]!, name] : [name, pair[2]!]

    return full.length > POSTGRES_MAX_IDENTIFIER && full.slice(0, POSTGRES_MAX_IDENTIFIER) === cut
  })
}

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('schema drift', () => {
  it('the migrations create everything the config expects', async () => {
    const adapter = payload.db as unknown as {
      drizzle: unknown
      requireDrizzleKit: () => {
        pushSchema: (
          schema: Record<string, unknown>,
          drizzle: unknown,
        ) => Promise<{ statementsToExecute: string[] }>
      }
      schema: Record<string, unknown>
    }

    const { pushSchema } = adapter.requireDrizzleKit()
    const { statementsToExecute } = await pushSchema(adapter.schema, adapter.drizzle)
    const missing = statementsToExecute.filter(
      (statement) =>
        !isDefaultOnly(statement) && !isTruncatedRename(statement, statementsToExecute),
    )

    expect(
      missing,
      `The config needs SQL the migrations don't run. Put it in a new migration:\n\n${missing.join('\n')}`,
    ).toEqual([])
  })
})
