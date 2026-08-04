import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Responsive image derivatives + video posters.
//
// `imageSizes` (sm/md/lg/xl) come back on the Media collection so the site can
// emit a real srcset — see getMediaSrcSet() in src/lib/media.ts, which reads
// these columns directly rather than guessing URLs. Payload writes NULL for
// any size larger than the original, and those rows are filtered out, so the
// site behaves correctly both before and after existing media is backfilled.
//
// `poster` is a self-relationship on media: a still image shown before a video
// plays, so the browser doesn't fetch part of a 21MB file just to paint a frame.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "sizes_sm_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xl_filename" varchar;

  ALTER TABLE "media" ADD COLUMN "poster_id" integer;
  ALTER TABLE "media" ADD CONSTRAINT "media_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

  CREATE INDEX "media_sizes_sm_sizes_sm_filename_idx" ON "media" USING btree ("sizes_sm_filename");
  CREATE INDEX "media_sizes_md_sizes_md_filename_idx" ON "media" USING btree ("sizes_md_filename");
  CREATE INDEX "media_sizes_lg_sizes_lg_filename_idx" ON "media" USING btree ("sizes_lg_filename");
  CREATE INDEX "media_sizes_xl_sizes_xl_filename_idx" ON "media" USING btree ("sizes_xl_filename");
  CREATE INDEX "media_poster_idx" ON "media" USING btree ("poster_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only drops the columns. The derivative files themselves stay in R2 —
  // deleting storage objects from a schema migration would make this
  // irreversible, so clean those up separately if you really want them gone.
  await db.execute(sql`
   ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_poster_id_media_id_fk";
  DROP INDEX IF EXISTS "media_poster_idx";
  DROP INDEX IF EXISTS "media_sizes_sm_sizes_sm_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_md_sizes_md_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_lg_sizes_lg_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_xl_sizes_xl_filename_idx";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "poster_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_sm_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_md_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lg_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xl_filename";`)
}
