import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Splits screen recordings out of `media` into their own `videos` collection,
 * so they can be uploaded straight to R2 from the browser and stop hitting
 * Vercel's 4.5MB function body limit (see collections/Videos.ts).
 *
 * The part that moves data: `mockupImage` and `mockupImageDark` become
 * polymorphic (`['media', 'videos']`), and Payload stores a polymorphic
 * relation in `projects_rels` rather than as a foreign key on `projects`. The
 * two existing columns are therefore copied into rels rows before being
 * dropped — `down` copies them back the same way.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'videos',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  CREATE INDEX IF NOT EXISTS "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "videos_filename_idx" ON "videos" USING btree ("filename");

  ALTER TABLE "projects_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;
  DO $$ BEGIN
    ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "projects_rels_videos_id_idx" ON "projects_rels" USING btree ("videos_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");`)

  // Carry the two mockup uploads over before the columns holding them go
  // away. `order` is 1 to match what Payload writes for these paths (the
  // existing `gallery` and `technologies` rows are 1-based too) — a single
  // upload is still just a rels row with one entry.
  await db.execute(sql`
  INSERT INTO "projects_rels" ("order", "parent_id", "path", "media_id")
  SELECT 1, "id", 'mockupImage', "mockup_image_id"
  FROM "projects"
  WHERE "mockup_image_id" IS NOT NULL;

  INSERT INTO "projects_rels" ("order", "parent_id", "path", "media_id")
  SELECT 1, "id", 'mockupImageDark', "mockup_image_dark_id"
  FROM "projects"
  WHERE "mockup_image_dark_id" IS NOT NULL;`)

  await db.execute(sql`
  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_mockup_image_id_media_id_fk";
  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_mockup_image_dark_id_media_id_fk";
  DROP INDEX IF EXISTS "projects_mockup_image_idx";
  DROP INDEX IF EXISTS "projects_mockup_image_dark_idx";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "mockup_image_id";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "mockup_image_dark_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mockup_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mockup_image_dark_id" integer;`)

  // Only the `media` side comes back: the pre-split columns were foreign keys
  // into `media`, so a mockup pointing at a video has nowhere to land. Those
  // rows are dropped rather than silently rewritten to the wrong file.
  await db.execute(sql`
  UPDATE "projects" SET "mockup_image_id" = "rels"."media_id"
  FROM "projects_rels" "rels"
  WHERE "rels"."parent_id" = "projects"."id"
    AND "rels"."path" = 'mockupImage'
    AND "rels"."media_id" IS NOT NULL;

  UPDATE "projects" SET "mockup_image_dark_id" = "rels"."media_id"
  FROM "projects_rels" "rels"
  WHERE "rels"."parent_id" = "projects"."id"
    AND "rels"."path" = 'mockupImageDark'
    AND "rels"."media_id" IS NOT NULL;

  DELETE FROM "projects_rels" WHERE "path" IN ('mockupImage', 'mockupImageDark');`)

  await db.execute(sql`
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
  CREATE INDEX IF NOT EXISTS "projects_mockup_image_dark_idx" ON "projects" USING btree ("mockup_image_dark_id");

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_videos_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_videos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "videos_id";

  ALTER TABLE "projects_rels" DROP CONSTRAINT IF EXISTS "projects_rels_videos_fk";
  DROP INDEX IF EXISTS "projects_rels_videos_id_idx";
  ALTER TABLE "projects_rels" DROP COLUMN IF EXISTS "videos_id";

  DROP TABLE IF EXISTS "videos" CASCADE;`)
}
