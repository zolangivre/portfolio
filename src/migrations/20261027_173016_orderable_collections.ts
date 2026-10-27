import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { generateNKeysBetween } from 'payload/shared'

// Six collections move from a hand-typed `order` number to Payload's
// `orderable`: a hidden `_order` fractional-index key, set by drag and drop in
// the admin list.
//
// Payload never fills `_order` for existing documents on its own. The first
// drag in the admin would number them in `find` order (newest first) and
// throw the hand-made order away, so `up` writes the keys itself, in the
// order the site shows today. The clauses below are the old queries' sorts,
// with the `-createdAt` Drizzle appends and Postgres' default NULL placement
// (ASC NULLS LAST, DESC NULLS FIRST), which is what Drizzle relied on.
// `featured` leaves the sort from here on, but it still decides today's
// order, so nothing moves on the day this ships.
//
// `order` is then dropped. `down` recreates it from the keys (1, 2, 3… in
// `_order` order, reversed for testimonials, which sorted it descending);
// which documents had no value is not recoverable, and doesn't need to be:
// the ranks give the same order.

type Table = {
  name: string
  siteOrder: string
  descending?: true
}

const TABLES: Table[] = [
  {
    name: 'projects',
    siteOrder: 't."featured" DESC, t."order" ASC, t."year" DESC, t."created_at" DESC',
  },
  {
    name: 'journal',
    siteOrder: 't."featured" DESC, t."order" ASC, t."date" DESC, t."created_at" DESC',
  },
  {
    name: 'testimonials',
    siteOrder: 't."featured" DESC, t."order" DESC, t."created_at" DESC',
    descending: true,
  },
  {
    name: 'experiences',
    siteOrder: 't."order" ASC, t."start_date" DESC, t."created_at" DESC',
  },
  {
    name: 'education',
    siteOrder: 't."order" ASC, t."start_date" DESC, t."created_at" DESC',
  },
]

// Categories were sorted in the browser rather than by a query: by `order`
// (unset last), then by name with `localeCompare`. The name step is redone in
// JS too, since Postgres' collation (`C` on some hosts) would place accented
// names differently.
async function categoriesInSiteOrder(db: MigrateUpArgs['db']): Promise<{ id: number }[]> {
  const { rows } = await db.execute(sql`
   SELECT t."id", t."order", l."name" FROM "categories" t LEFT JOIN "categories_locales" l ON l."_parent_id" = t."id" AND l."_locale" = 'fr' ORDER BY t."created_at" DESC, t."id" DESC;`)
  const categories = rows as { id: number; name: string | null; order: string | null }[]

  return categories.sort(
    (a, b) =>
      (a.order === null ? Infinity : Number(a.order)) -
        (b.order === null ? Infinity : Number(b.order)) ||
      (a.name ?? '').localeCompare(b.name ?? ''),
  )
}

const ALL_TABLES = [...TABLES.map(({ name }) => name), 'categories']

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  for (const name of ALL_TABLES) {
    await db.execute(sql`
   ALTER TABLE ${sql.identifier(name)} ADD COLUMN IF NOT EXISTS "_order" varchar;
  CREATE INDEX IF NOT EXISTS ${sql.identifier(`${name}__order_idx`)} ON ${sql.identifier(name)} USING btree ("_order");`)

    const table = TABLES.find((candidate) => candidate.name === name)
    const rows = table
      ? ((
          await db.execute(
            sql.raw(`SELECT t."id" FROM "${name}" t ORDER BY ${table.siteOrder}, t."id" DESC;`),
          )
        ).rows as { id: number }[])
      : await categoriesInSiteOrder(db)
    const keys = generateNKeysBetween(null, null, rows.length)

    for (const [index, row] of rows.entries()) {
      await db.execute(sql`
   UPDATE ${sql.identifier(name)} SET "_order" = ${keys[index]} WHERE "id" = ${row.id};`)
    }

    await db.execute(sql`
   ALTER TABLE ${sql.identifier(name)} DROP COLUMN IF EXISTS "order";`)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  for (const tableName of ALL_TABLES) {
    const table = TABLES.find((candidate) => candidate.name === tableName)
    const name = sql.identifier(tableName)
    const direction = sql.raw(table?.descending ? 'DESC' : 'ASC')

    await db.execute(sql`
   ALTER TABLE ${name} ADD COLUMN IF NOT EXISTS "order" numeric${sql.raw(table?.descending ? ' DEFAULT 0' : '')};
  UPDATE ${name} t SET "order" = r."rank" FROM (SELECT "id", row_number() OVER (ORDER BY "_order" ${direction}, "created_at" DESC) AS "rank" FROM ${name}) r WHERE t."id" = r."id";
  DROP INDEX IF EXISTS ${sql.identifier(`${tableName}__order_idx`)};
  ALTER TABLE ${name} DROP COLUMN IF EXISTS "_order";`)
  }
}
