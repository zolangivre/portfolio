import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Trash on every content collection: `deleted_at` on each table (and
// `version_deleted_at` on the version tables of the four collections with
// drafts), as Drizzle generates them. Nothing to backfill: no document is in
// a trash yet.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "technologies" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "education" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "journal" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_education_v" ADD COLUMN IF NOT EXISTS "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_experiences_v" ADD COLUMN IF NOT EXISTS "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN IF NOT EXISTS "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_journal_v" ADD COLUMN IF NOT EXISTS "version_deleted_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "messages_deleted_at_idx" ON "messages" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "companies_deleted_at_idx" ON "companies" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "schools_deleted_at_idx" ON "schools" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "media_deleted_at_idx" ON "media" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "skills_deleted_at_idx" ON "skills" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "testimonials_deleted_at_idx" ON "testimonials" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "technologies_deleted_at_idx" ON "technologies" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "experiences_deleted_at_idx" ON "experiences" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "education_deleted_at_idx" ON "education" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "categories_deleted_at_idx" ON "categories" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "journal_deleted_at_idx" ON "journal" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "_education_v_version_version_deleted_at_idx" ON "_education_v" USING btree ("version_deleted_at");
  CREATE INDEX IF NOT EXISTS "videos_deleted_at_idx" ON "videos" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "_experiences_v_version_version_deleted_at_idx" ON "_experiences_v" USING btree ("version_deleted_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_deleted_at_idx" ON "_projects_v" USING btree ("version_deleted_at");
  CREATE INDEX IF NOT EXISTS "_journal_v_version_version_deleted_at_idx" ON "_journal_v" USING btree ("version_deleted_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Without `deleted_at`, whatever sits in a trash would be back on the site.
  // Refuse rather than publish it: empty the trashes (restore or delete for
  // good) first.
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "messages" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "companies" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "schools" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "media" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "skills" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "testimonials" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "technologies" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "experiences" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "education" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "categories" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "journal" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "projects" WHERE "deleted_at" IS NOT NULL) OR EXISTS (SELECT 1 FROM "videos" WHERE "deleted_at" IS NOT NULL) THEN
      RAISE EXCEPTION 'Documents are in a trash: restore or delete them for good before migrating down.';
    END IF;
  END $$;`)

  await db.execute(sql`
   DROP INDEX IF EXISTS "messages_deleted_at_idx";
  DROP INDEX IF EXISTS "companies_deleted_at_idx";
  DROP INDEX IF EXISTS "schools_deleted_at_idx";
  DROP INDEX IF EXISTS "media_deleted_at_idx";
  DROP INDEX IF EXISTS "skills_deleted_at_idx";
  DROP INDEX IF EXISTS "testimonials_deleted_at_idx";
  DROP INDEX IF EXISTS "technologies_deleted_at_idx";
  DROP INDEX IF EXISTS "experiences_deleted_at_idx";
  DROP INDEX IF EXISTS "education_deleted_at_idx";
  DROP INDEX IF EXISTS "categories_deleted_at_idx";
  DROP INDEX IF EXISTS "journal_deleted_at_idx";
  DROP INDEX IF EXISTS "projects_deleted_at_idx";
  DROP INDEX IF EXISTS "_education_v_version_version_deleted_at_idx";
  DROP INDEX IF EXISTS "videos_deleted_at_idx";
  DROP INDEX IF EXISTS "_experiences_v_version_version_deleted_at_idx";
  DROP INDEX IF EXISTS "_projects_v_version_version_deleted_at_idx";
  DROP INDEX IF EXISTS "_journal_v_version_version_deleted_at_idx";
  ALTER TABLE "messages" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "companies" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "schools" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "skills" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "technologies" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "experiences" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "education" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "journal" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "_education_v" DROP COLUMN IF EXISTS "version_deleted_at";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "deleted_at";
  ALTER TABLE "_experiences_v" DROP COLUMN IF EXISTS "version_deleted_at";
  ALTER TABLE "_projects_v" DROP COLUMN IF EXISTS "version_deleted_at";
  ALTER TABLE "_journal_v" DROP COLUMN IF EXISTS "version_deleted_at";`)
}
