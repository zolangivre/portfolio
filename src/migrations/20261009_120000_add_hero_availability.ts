import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Hero's `availability` group: a non-localized on/off checkbox on `hero`, and
// the localized badge text on `hero_locales`.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hero" ADD COLUMN IF NOT EXISTS "availability_enabled" boolean DEFAULT false;
  ALTER TABLE "hero_locales" ADD COLUMN IF NOT EXISTS "availability_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hero_locales" DROP COLUMN IF EXISTS "availability_label";
  ALTER TABLE "hero" DROP COLUMN IF EXISTS "availability_enabled";`)
}
