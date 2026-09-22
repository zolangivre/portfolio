import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_projects_mockup_frame" AS ENUM('none', 'phone', 'desktop');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mockup_frame" "enum_projects_mockup_frame" DEFAULT 'none';
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mockup_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mockup_image_dark_id" integer;
  DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_mockup_image_id_media_id_fk" FOREIGN KEY ("mockup_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_mockup_image_dark_id_media_id_fk" FOREIGN KEY ("mockup_image_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "projects_mockup_image_idx" ON "projects" USING btree ("mockup_image_id");
  CREATE INDEX IF NOT EXISTS "projects_mockup_image_dark_idx" ON "projects" USING btree ("mockup_image_dark_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_mockup_image_id_media_id_fk";
  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_mockup_image_dark_id_media_id_fk";
  DROP INDEX IF EXISTS "projects_mockup_image_idx";
  DROP INDEX IF EXISTS "projects_mockup_image_dark_idx";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "mockup_frame";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "mockup_image_id";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "mockup_image_dark_id";
  DROP TYPE IF EXISTS "public"."enum_projects_mockup_frame";`)
}
