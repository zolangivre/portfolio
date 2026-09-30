import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Columns Payload 3.90 adds on its own, with no config change on our side:
// `reset_password_requested_at` on every auth collection, and `_objectkey` on
// every collection handled by the cloud storage plugin (a per-upload folder
// segment, joined after `prefix`). Existing rows keep `_objectkey` null, which
// resolves to the same R2 key as before, so no backfill is needed.
// `videos.prefix` already exists (20260923_120000_add_videos_collection); it is
// repeated here only because 3.90's schema now declares it.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'videos';
  ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "_objectkey";`)
}
