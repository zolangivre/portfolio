import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "about_locales" ADD COLUMN IF NOT EXISTS "eyebrow" varchar DEFAULT 'About';
  ALTER TABLE "contact_locales" ADD COLUMN IF NOT EXISTS "eyebrow" varchar DEFAULT 'Contact';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "about_locales" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "contact_locales" DROP COLUMN IF EXISTS "eyebrow";`)
}
