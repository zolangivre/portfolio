import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Media's `placeholder`: the generated blurred preview (a small data URL)
// shown while an image loads.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "placeholder" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN IF EXISTS "placeholder";`)
}
