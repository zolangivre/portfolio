import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Catch-up: Hero's `resumeCta` group was added to the config without a
// migration, so dev push had these columns but a database built from the
// repo's migrations alone did not, and the Hero global broke on first read.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hero_locales" ADD COLUMN IF NOT EXISTS "resume_cta_label" varchar DEFAULT 'Download CV';
  ALTER TABLE "hero_locales" ADD COLUMN IF NOT EXISTS "resume_cta_file_id" integer;
  DO $$ BEGIN
    ALTER TABLE "hero_locales" ADD CONSTRAINT "hero_locales_resume_cta_file_id_media_id_fk" FOREIGN KEY ("resume_cta_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "hero_resume_cta_resume_cta_file_idx" ON "hero_locales" USING btree ("resume_cta_file_id","_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hero_locales" DROP CONSTRAINT IF EXISTS "hero_locales_resume_cta_file_id_media_id_fk";
  DROP INDEX IF EXISTS "hero_resume_cta_resume_cta_file_idx";
  ALTER TABLE "hero_locales" DROP COLUMN IF EXISTS "resume_cta_file_id";
  ALTER TABLE "hero_locales" DROP COLUMN IF EXISTS "resume_cta_label";`)
}
