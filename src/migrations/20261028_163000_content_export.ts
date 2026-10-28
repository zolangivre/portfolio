import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The import-export plugin: its `exports` collection (one row per export saved
// from the admin; downloads, the only mode turned on, create none) and its
// `imports` collection, which nothing uses since import is off, plus the
// plugin's two job tasks in the job enums. Drizzle's own SQL from the
// schema-drift test. down() drops the two collections; the job enum values
// stay, since Postgres can't drop one and no job uses them (hence the
// IF NOT EXISTS when up() runs again).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'fr', 'en');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'createCollectionExport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'createCollectionImport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'createCollectionExport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'createCollectionImport' BEFORE 'schedulePublish';
  CREATE TABLE "exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
	"limit" numeric,
	"page" numeric DEFAULT 1,
	"sort" varchar,
	"sort_order" "enum_exports_sort_order",
	"locale" "enum_exports_locale" DEFAULT 'all',
	"drafts" "enum_exports_drafts" DEFAULT 'yes',
	"collection_slug" varchar DEFAULT 'projects' NOT NULL,
	"where" jsonb DEFAULT '{}'::jsonb,
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

  CREATE TABLE "exports_texts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"text" varchar
);

  CREATE TABLE "imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_slug" varchar NOT NULL,
	"import_mode" "enum_imports_import_mode",
	"match_field" varchar DEFAULT 'id',
	"status" "enum_imports_status" DEFAULT 'pending',
	"summary_imported" numeric,
	"summary_updated" numeric,
	"summary_total" numeric,
	"summary_issues" numeric,
	"summary_issue_details" jsonb,
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

  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "exports_texts" CASCADE;
  DROP TABLE IF EXISTS "exports" CASCADE;
  DROP TABLE IF EXISTS "imports" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_exports_format";
  DROP TYPE IF EXISTS "public"."enum_exports_sort_order";
  DROP TYPE IF EXISTS "public"."enum_exports_locale";
  DROP TYPE IF EXISTS "public"."enum_exports_drafts";
  DROP TYPE IF EXISTS "public"."enum_imports_import_mode";
  DROP TYPE IF EXISTS "public"."enum_imports_status";`)
}
