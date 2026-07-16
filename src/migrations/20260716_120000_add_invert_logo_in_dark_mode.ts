import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "technologies" ADD COLUMN IF NOT EXISTS "invert_logo_in_dark_mode" boolean DEFAULT false;
  ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "invert_logo_in_dark_mode" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "technologies" DROP COLUMN IF EXISTS "invert_logo_in_dark_mode";
  ALTER TABLE "skills" DROP COLUMN IF EXISTS "invert_logo_in_dark_mode";`)
}
