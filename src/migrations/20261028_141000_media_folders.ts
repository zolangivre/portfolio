import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Folders for media and videos (`folders: true` on both): Payload's folder
// collection (`payload-folders`, nested through its own `folder_id`, scoped to
// media or videos through `folder_type`), a `folder_id` on media and videos,
// and the relationship column every collection gets in the locked-documents
// table. Drizzle's own SQL from the schema-drift test. Every file starts at
// the root. down() drops the folders: the files stay, unsorted.
//
// First of all, it clears the leftovers of an old folders trial made through
// a dev push and never committed (the local database had them; staging's and
// production's may too, like the drafts trial's): the folder table, and the
// folder columns with their indexes and keys. On a database built from the
// migrations alone, that step does nothing. A leftover folder table that holds
// rows stops the migration instead of being dropped.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  DECLARE has_rows boolean;
  BEGIN
    IF to_regclass('public.payload_folders') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM payload_folders)' INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'Leftover table payload_folders from an old folders trial holds rows: back it up and drop it, then migrate again.';
      END IF;
    END IF;
    ALTER TABLE "media" DROP COLUMN IF EXISTS "folder_id";
    ALTER TABLE "videos" DROP COLUMN IF EXISTS "folder_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_folders_id";
    DROP TABLE IF EXISTS "payload_folders_folder_type" CASCADE;
    DROP TABLE IF EXISTS "payload_folders" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_payload_folders_folder_type";
  END $$;`)

  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media', 'videos');
  CREATE TABLE "payload_folders_folder_type" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_payload_folders_folder_type",
	"id" serial PRIMARY KEY NOT NULL
);

  CREATE TABLE "payload_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"folder_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_folders_id" integer;
  ALTER TABLE "media" ADD COLUMN "folder_id" integer;
  ALTER TABLE "videos" ADD COLUMN "folder_id" integer;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "videos_folder_idx" ON "videos" USING btree ("folder_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_folders_fk";
  ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_folder_id_payload_folders_id_fk";
  ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_folder_id_payload_folders_id_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_payload_folders_id_idx";
  DROP INDEX IF EXISTS "media_folder_idx";
  DROP INDEX IF EXISTS "videos_folder_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_folders_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "folder_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "folder_id";
  DROP TABLE IF EXISTS "payload_folders_folder_type" CASCADE;
  DROP TABLE IF EXISTS "payload_folders" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_payload_folders_folder_type";`)
}
