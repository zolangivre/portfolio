import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Enables Payload's native Folders on the Media collection (`folders: true` in
// src/collections/Media.ts, root `folders` config in src/payload.config.ts).
//
// Payload auto-generates a `payload-folders` collection whose `folder` field
// points back at itself — that self-relationship is what makes folders
// nestable. Each folder-enabled collection also gains a hidden `folder`
// relationship column, which is how a medium is "moved" between folders.
//
// Root config sets `collectionSpecific: false`, so folders are not scoped to a
// set of collections and no `payload_folders_folder_type` table is generated.
// Turning that option back on later would need its own migration.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");

  ALTER TABLE "media" ADD COLUMN "folder_id" integer;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_folders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drops the folder tree. Media rows survive — they just lose their folder
  // assignment, which is the same end state as before folders existed.
  await db.execute(sql`
   ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_folder_id_payload_folders_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_folders_fk";
  DROP INDEX IF EXISTS "media_folder_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_payload_folders_id_idx";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "folder_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_folders_id";
  DROP TABLE IF EXISTS "payload_folders" CASCADE;`)
}
