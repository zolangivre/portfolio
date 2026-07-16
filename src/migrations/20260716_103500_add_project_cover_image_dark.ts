import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cover_image_dark_id" integer;
  DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_dark_id_media_id_fk" FOREIGN KEY ("cover_image_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "projects_cover_image_dark_idx" ON "projects" USING btree ("cover_image_dark_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_cover_image_dark_id_media_id_fk";
  DROP INDEX IF EXISTS "projects_cover_image_dark_idx";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "cover_image_dark_id";`)
}
