import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Settings' theme group: the `backgroundStyle` select, and the
// `backgroundPhotos` array (one upload per row) used by the photo background.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_settings_theme_background_style" AS ENUM('gradient', 'photo', 'spatial', 'playground', 'daylight', 'colorBlocks');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  CREATE TABLE IF NOT EXISTS "settings_theme_background_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer
  );
  ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_background_style" "enum_settings_theme_background_style" DEFAULT 'gradient';
  DO $$ BEGIN
    ALTER TABLE "settings_theme_background_photos" ADD CONSTRAINT "settings_theme_background_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "settings_theme_background_photos" ADD CONSTRAINT "settings_theme_background_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "settings_theme_background_photos_order_idx" ON "settings_theme_background_photos" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "settings_theme_background_photos_parent_id_idx" ON "settings_theme_background_photos" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "settings_theme_background_photos_photo_idx" ON "settings_theme_background_photos" USING btree ("photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_theme_background_photos" DROP CONSTRAINT IF EXISTS "settings_theme_background_photos_photo_id_media_id_fk";
  ALTER TABLE "settings_theme_background_photos" DROP CONSTRAINT IF EXISTS "settings_theme_background_photos_parent_id_fk";
  DROP INDEX IF EXISTS "settings_theme_background_photos_order_idx";
  DROP INDEX IF EXISTS "settings_theme_background_photos_parent_id_idx";
  DROP INDEX IF EXISTS "settings_theme_background_photos_photo_idx";
  DROP TABLE IF EXISTS "settings_theme_background_photos";
  ALTER TABLE "settings" DROP COLUMN IF EXISTS "theme_background_style";
  DROP TYPE IF EXISTS "public"."enum_settings_theme_background_style";`)
}
