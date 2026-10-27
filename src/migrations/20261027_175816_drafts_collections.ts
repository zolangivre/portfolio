import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Drafts, autosave and scheduled publishing on projects, journal, experiences
// and education (collections/drafts.ts).
//
// Projects and journal had a `visibility` switch (public / private) doing a
// draft's job; Payload's `_status` replaces it: private → draft, public →
// published. Experiences and education had no such notion, so everything in
// them is published.
//
// The project's own `status` select (live / in progress / archived) was
// `enum_projects_status`, the name the adapter now gives `_status` (it
// snake-cases both to `status`). Its enum is renamed first, to the `enumName`
// the field now carries.
//
// Then the version tables, and the job queue that runs scheduled publishes.
//
// Last, each existing document gets one version, a copy of its main row: the
// admin lists of a collection with drafts read the version tables, so without
// it every existing document would vanish from the admin while still showing
// on the site.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_projects_status" RENAME TO "enum_projects_project_status";
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_journal_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_experiences_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_education_status" AS ENUM('draft', 'published');
  ALTER TABLE "projects" ADD COLUMN "_status" "enum_projects_status" DEFAULT 'draft';
  ALTER TABLE "journal" ADD COLUMN "_status" "enum_journal_status" DEFAULT 'draft';
  ALTER TABLE "experiences" ADD COLUMN "_status" "enum_experiences_status" DEFAULT 'draft';
  ALTER TABLE "education" ADD COLUMN "_status" "enum_education_status" DEFAULT 'draft';
  UPDATE "projects" SET "_status" = CASE WHEN "visibility" = 'private' THEN 'draft' ELSE 'published' END::"enum_projects_status";
  UPDATE "journal" SET "_status" = CASE WHEN "visibility" = 'private' THEN 'draft' ELSE 'published' END::"enum_journal_status";
  UPDATE "experiences" SET "_status" = 'published';
  UPDATE "education" SET "_status" = 'published';
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "journal__status_idx" ON "journal" USING btree ("_status");
  CREATE INDEX "experiences__status_idx" ON "experiences" USING btree ("_status");
  CREATE INDEX "education__status_idx" ON "education" USING btree ("_status");
  ALTER TABLE "projects" DROP COLUMN "visibility";
  ALTER TABLE "journal" DROP COLUMN "visibility";
  DROP TYPE "public"."enum_projects_visibility";
  DROP TYPE "public"."enum_journal_visibility";`)

  // Version tables and the job queue, as Drizzle generates them. Drafts may be
  // incomplete, so the fields `required` used to make NOT NULL lose it.
  await db.execute(sql`
   CREATE TYPE "public"."enum__projects_v_version_mockup_frame" AS ENUM('none', 'phone', 'desktop', 'custom');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum__experiences_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experiences_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum__education_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__education_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum__journal_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__journal_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "_projects_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version__order" varchar,
	"version_slug" varchar,
	"version_cover_image_id" integer,
	"version_cover_image_dark_id" integer,
	"version_mockup_frame" "enum__projects_v_version_mockup_frame" DEFAULT 'none',
	"version_github_url" varchar,
	"version_live_url" varchar,
	"version_featured" boolean DEFAULT false,
	"version_year" numeric,
	"version_status" "enum_projects_project_status" DEFAULT 'live',
	"version_category_id" integer,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__projects_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_projects_v_locales" (
	"version_title" varchar,
	"version_short_description" varchar,
	"version_description" jsonb,
	"version_meta_title" varchar,
	"version_meta_description" varchar,
	"version_meta_image_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_projects_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"media_id" integer,
	"videos_id" integer,
	"technologies_id" integer
);
  CREATE TABLE "_experiences_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version__order" varchar,
	"version_company_id" integer,
	"version_start_date" timestamp(3) with time zone,
	"version_end_date" timestamp(3) with time zone,
	"version_currently_working" boolean DEFAULT false,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__experiences_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__experiences_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_experiences_v_locales" (
	"version_position" varchar,
	"version_employment_type" varchar,
	"version_location" varchar,
	"version_description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_experiences_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"technologies_id" integer
);
  CREATE TABLE "_education_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version__order" varchar,
	"version_school_id" integer,
	"version_start_date" timestamp(3) with time zone,
	"version_end_date" timestamp(3) with time zone,
	"version_currently_studying" boolean DEFAULT false,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__education_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__education_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_education_v_locales" (
	"version_degree" varchar,
	"version_field_of_study" varchar,
	"version_description" jsonb,
	"version_location" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_journal_v_version_tags" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"_uuid" varchar
);
  CREATE TABLE "_journal_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version__order" varchar,
	"version_slug" varchar,
	"version_category_id" integer,
	"version_cover_image_id" integer,
	"version_date" timestamp(3) with time zone,
	"version_featured" boolean DEFAULT false,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__journal_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__journal_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_journal_v_locales" (
	"version_title" varchar,
	"version_short_description" varchar,
	"version_content" jsonb,
	"version_location" varchar,
	"version_meta_title" varchar,
	"version_meta_description" varchar,
	"version_meta_image_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_journal_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"media_id" integer
);
  CREATE TABLE "payload_jobs_log" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"executed_at" timestamp(3) with time zone NOT NULL,
	"completed_at" timestamp(3) with time zone NOT NULL,
	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
	"task_i_d" varchar NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"state" "enum_payload_jobs_log_state" NOT NULL,
	"error" jsonb
);
  CREATE TABLE "payload_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"input" jsonb,
	"completed_at" timestamp(3) with time zone,
	"total_tried" numeric DEFAULT 0,
	"has_error" boolean DEFAULT false,
	"error" jsonb,
	"task_slug" "enum_payload_jobs_task_slug",
	"queue" varchar DEFAULT 'default',
	"wait_until" timestamp(3) with time zone,
	"processing" boolean DEFAULT false,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
  ALTER TABLE "projects_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "projects_locales" ALTER COLUMN "short_description" DROP NOT NULL;
  ALTER TABLE "projects_locales" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "experiences_locales" ALTER COLUMN "position" DROP NOT NULL;
  ALTER TABLE "experiences_locales" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "education_locales" ALTER COLUMN "degree" DROP NOT NULL;
  ALTER TABLE "experiences" ALTER COLUMN "company_id" DROP NOT NULL;
  ALTER TABLE "experiences" ALTER COLUMN "start_date" DROP NOT NULL;
  ALTER TABLE "education" ALTER COLUMN "school_id" DROP NOT NULL;
  ALTER TABLE "education" ALTER COLUMN "start_date" DROP NOT NULL;
  ALTER TABLE "journal_tags" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "short_description" DROP NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "date" DROP NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_dark_id_media_id_fk" FOREIGN KEY ("version_cover_image_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_technologies_fk" FOREIGN KEY ("technologies_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_parent_id_experiences_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_company_id_companies_id_fk" FOREIGN KEY ("version_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v_locales" ADD CONSTRAINT "_experiences_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_technologies_fk" FOREIGN KEY ("technologies_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_education_v" ADD CONSTRAINT "_education_v_parent_id_education_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."education"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_education_v" ADD CONSTRAINT "_education_v_version_school_id_schools_id_fk" FOREIGN KEY ("version_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_education_v_locales" ADD CONSTRAINT "_education_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_education_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journal_v_version_tags" ADD CONSTRAINT "_journal_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journal_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journal_v" ADD CONSTRAINT "_journal_v_parent_id_journal_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."journal"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journal_v" ADD CONSTRAINT "_journal_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journal_v" ADD CONSTRAINT "_journal_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journal_v_locales" ADD CONSTRAINT "_journal_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journal_v_locales" ADD CONSTRAINT "_journal_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journal_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journal_v_rels" ADD CONSTRAINT "_journal_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_journal_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journal_v_rels" ADD CONSTRAINT "_journal_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version__order_idx" ON "_projects_v" USING btree ("version__order");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_cover_image_idx" ON "_projects_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_projects_v_version_version_cover_image_dark_idx" ON "_projects_v" USING btree ("version_cover_image_dark_id");
  CREATE INDEX "_projects_v_version_version_featured_idx" ON "_projects_v" USING btree ("version_featured");
  CREATE INDEX "_projects_v_version_version_category_idx" ON "_projects_v" USING btree ("version_category_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
  CREATE INDEX "_projects_v_version_meta_version_meta_image_idx" ON "_projects_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_locales_parent_id_idx" ON "_projects_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  CREATE INDEX "_projects_v_rels_videos_id_idx" ON "_projects_v_rels" USING btree ("videos_id");
  CREATE INDEX "_projects_v_rels_technologies_id_idx" ON "_projects_v_rels" USING btree ("technologies_id");
  CREATE INDEX "_experiences_v_parent_idx" ON "_experiences_v" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_version_version__order_idx" ON "_experiences_v" USING btree ("version__order");
  CREATE INDEX "_experiences_v_version_version_company_idx" ON "_experiences_v" USING btree ("version_company_id");
  CREATE INDEX "_experiences_v_version_version_updated_at_idx" ON "_experiences_v" USING btree ("version_updated_at");
  CREATE INDEX "_experiences_v_version_version_created_at_idx" ON "_experiences_v" USING btree ("version_created_at");
  CREATE INDEX "_experiences_v_version_version__status_idx" ON "_experiences_v" USING btree ("version__status");
  CREATE INDEX "_experiences_v_created_at_idx" ON "_experiences_v" USING btree ("created_at");
  CREATE INDEX "_experiences_v_updated_at_idx" ON "_experiences_v" USING btree ("updated_at");
  CREATE INDEX "_experiences_v_snapshot_idx" ON "_experiences_v" USING btree ("snapshot");
  CREATE INDEX "_experiences_v_published_locale_idx" ON "_experiences_v" USING btree ("published_locale");
  CREATE INDEX "_experiences_v_latest_idx" ON "_experiences_v" USING btree ("latest");
  CREATE INDEX "_experiences_v_autosave_idx" ON "_experiences_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_experiences_v_locales_locale_parent_id_unique" ON "_experiences_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_experiences_v_locales_parent_id_idx" ON "_experiences_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_rels_order_idx" ON "_experiences_v_rels" USING btree ("order");
  CREATE INDEX "_experiences_v_rels_parent_idx" ON "_experiences_v_rels" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_rels_path_idx" ON "_experiences_v_rels" USING btree ("path");
  CREATE INDEX "_experiences_v_rels_technologies_id_idx" ON "_experiences_v_rels" USING btree ("technologies_id");
  CREATE INDEX "_education_v_parent_idx" ON "_education_v" USING btree ("parent_id");
  CREATE INDEX "_education_v_version_version__order_idx" ON "_education_v" USING btree ("version__order");
  CREATE INDEX "_education_v_version_version_school_idx" ON "_education_v" USING btree ("version_school_id");
  CREATE INDEX "_education_v_version_version_updated_at_idx" ON "_education_v" USING btree ("version_updated_at");
  CREATE INDEX "_education_v_version_version_created_at_idx" ON "_education_v" USING btree ("version_created_at");
  CREATE INDEX "_education_v_version_version__status_idx" ON "_education_v" USING btree ("version__status");
  CREATE INDEX "_education_v_created_at_idx" ON "_education_v" USING btree ("created_at");
  CREATE INDEX "_education_v_updated_at_idx" ON "_education_v" USING btree ("updated_at");
  CREATE INDEX "_education_v_snapshot_idx" ON "_education_v" USING btree ("snapshot");
  CREATE INDEX "_education_v_published_locale_idx" ON "_education_v" USING btree ("published_locale");
  CREATE INDEX "_education_v_latest_idx" ON "_education_v" USING btree ("latest");
  CREATE INDEX "_education_v_autosave_idx" ON "_education_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_education_v_locales_locale_parent_id_unique" ON "_education_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_education_v_locales_parent_id_idx" ON "_education_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_journal_v_version_tags_order_idx" ON "_journal_v_version_tags" USING btree ("_order");
  CREATE INDEX "_journal_v_version_tags_parent_id_idx" ON "_journal_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_journal_v_parent_idx" ON "_journal_v" USING btree ("parent_id");
  CREATE INDEX "_journal_v_version_version__order_idx" ON "_journal_v" USING btree ("version__order");
  CREATE INDEX "_journal_v_version_version_slug_idx" ON "_journal_v" USING btree ("version_slug");
  CREATE INDEX "_journal_v_version_version_category_idx" ON "_journal_v" USING btree ("version_category_id");
  CREATE INDEX "_journal_v_version_version_cover_image_idx" ON "_journal_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_journal_v_version_version_featured_idx" ON "_journal_v" USING btree ("version_featured");
  CREATE INDEX "_journal_v_version_version_updated_at_idx" ON "_journal_v" USING btree ("version_updated_at");
  CREATE INDEX "_journal_v_version_version_created_at_idx" ON "_journal_v" USING btree ("version_created_at");
  CREATE INDEX "_journal_v_version_version__status_idx" ON "_journal_v" USING btree ("version__status");
  CREATE INDEX "_journal_v_created_at_idx" ON "_journal_v" USING btree ("created_at");
  CREATE INDEX "_journal_v_updated_at_idx" ON "_journal_v" USING btree ("updated_at");
  CREATE INDEX "_journal_v_snapshot_idx" ON "_journal_v" USING btree ("snapshot");
  CREATE INDEX "_journal_v_published_locale_idx" ON "_journal_v" USING btree ("published_locale");
  CREATE INDEX "_journal_v_latest_idx" ON "_journal_v" USING btree ("latest");
  CREATE INDEX "_journal_v_autosave_idx" ON "_journal_v" USING btree ("autosave");
  CREATE INDEX "_journal_v_version_meta_version_meta_image_idx" ON "_journal_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_journal_v_locales_locale_parent_id_unique" ON "_journal_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_journal_v_locales_parent_id_idx" ON "_journal_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_journal_v_rels_order_idx" ON "_journal_v_rels" USING btree ("order");
  CREATE INDEX "_journal_v_rels_parent_idx" ON "_journal_v_rels" USING btree ("parent_id");
  CREATE INDEX "_journal_v_rels_path_idx" ON "_journal_v_rels" USING btree ("path");
  CREATE INDEX "_journal_v_rels_media_id_idx" ON "_journal_v_rels" USING btree ("media_id");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");`)

  // One version per existing document, copied from its main row (with its
  // locales, relationships and arrays) and marked latest — the shape Payload
  // writes on a save: relationship paths gain a `version.` prefix, array rows
  // get a new id and keep the original one in `_uuid`.
  await db.execute(sql`
   INSERT INTO "_projects_v" ("parent_id", "version__order", "version_slug", "version_cover_image_id", "version_cover_image_dark_id", "version_mockup_frame", "version_github_url", "version_live_url", "version_featured", "version_year", "version_status", "version_category_id", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "_order", "slug", "cover_image_id", "cover_image_dark_id", "mockup_frame"::text::"enum__projects_v_version_mockup_frame", "github_url", "live_url", "featured", "year", "status", "category_id", "updated_at", "created_at", "_status"::text::"enum__projects_v_version_status", "updated_at", "updated_at", true, false FROM "projects";
  INSERT INTO "_projects_v_locales" ("_locale", "_parent_id", "version_title", "version_short_description", "version_description", "version_meta_title", "version_meta_description", "version_meta_image_id") SELECT l."_locale", v."id", l."title", l."short_description", l."description", l."meta_title", l."meta_description", l."meta_image_id" FROM "projects_locales" l JOIN "_projects_v" v ON v."parent_id" = l."_parent_id";
  INSERT INTO "_projects_v_rels" ("parent_id", "path", "order", "media_id", "videos_id", "technologies_id") SELECT v."id", 'version.' || r."path", r."order", r."media_id", r."videos_id", r."technologies_id" FROM "projects_rels" r JOIN "_projects_v" v ON v."parent_id" = r."parent_id";
  INSERT INTO "_journal_v" ("parent_id", "version__order", "version_slug", "version_category_id", "version_cover_image_id", "version_date", "version_featured", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "_order", "slug", "category_id", "cover_image_id", "date", "featured", "updated_at", "created_at", "_status"::text::"enum__journal_v_version_status", "updated_at", "updated_at", true, false FROM "journal";
  INSERT INTO "_journal_v_locales" ("_locale", "_parent_id", "version_title", "version_short_description", "version_content", "version_location", "version_meta_title", "version_meta_description", "version_meta_image_id") SELECT l."_locale", v."id", l."title", l."short_description", l."content", l."location", l."meta_title", l."meta_description", l."meta_image_id" FROM "journal_locales" l JOIN "_journal_v" v ON v."parent_id" = l."_parent_id";
  INSERT INTO "_journal_v_rels" ("parent_id", "path", "order", "media_id") SELECT v."id", 'version.' || r."path", r."order", r."media_id" FROM "journal_rels" r JOIN "_journal_v" v ON v."parent_id" = r."parent_id";
  INSERT INTO "_journal_v_version_tags" ("_order", "_parent_id", "_uuid", "value") SELECT a."_order", v."id", a."id", a."value" FROM "journal_tags" a JOIN "_journal_v" v ON v."parent_id" = a."_parent_id";
  INSERT INTO "_experiences_v" ("parent_id", "version__order", "version_company_id", "version_start_date", "version_end_date", "version_currently_working", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "_order", "company_id", "start_date", "end_date", "currently_working", "updated_at", "created_at", "_status"::text::"enum__experiences_v_version_status", "updated_at", "updated_at", true, false FROM "experiences";
  INSERT INTO "_experiences_v_locales" ("_locale", "_parent_id", "version_position", "version_employment_type", "version_location", "version_description") SELECT l."_locale", v."id", l."position", l."employment_type", l."location", l."description" FROM "experiences_locales" l JOIN "_experiences_v" v ON v."parent_id" = l."_parent_id";
  INSERT INTO "_experiences_v_rels" ("parent_id", "path", "order", "technologies_id") SELECT v."id", 'version.' || r."path", r."order", r."technologies_id" FROM "experiences_rels" r JOIN "_experiences_v" v ON v."parent_id" = r."parent_id";
  INSERT INTO "_education_v" ("parent_id", "version__order", "version_school_id", "version_start_date", "version_end_date", "version_currently_studying", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "_order", "school_id", "start_date", "end_date", "currently_studying", "updated_at", "created_at", "_status"::text::"enum__education_v_version_status", "updated_at", "updated_at", true, false FROM "education";
  INSERT INTO "_education_v_locales" ("_locale", "_parent_id", "version_degree", "version_field_of_study", "version_description", "version_location") SELECT l."_locale", v."id", l."degree", l."field_of_study", l."description", l."location" FROM "education_locales" l JOIN "_education_v" v ON v."parent_id" = l."_parent_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Experiences and education have no `visibility` to fall back on: their
  // drafts would go live. Refuse rather than publish or delete them silently.
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "experiences" WHERE "_status" = 'draft') OR EXISTS (SELECT 1 FROM "education" WHERE "_status" = 'draft') THEN
      RAISE EXCEPTION 'Draft experiences or education entries would become public: publish or delete them before migrating down.';
    END IF;
  END $$;`)

  // SET NOT NULL fails if a draft left a required field empty: fill it, or
  // delete that draft, before migrating down.
  await db.execute(sql`
   DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "_journal_v_rels" CASCADE;
  DROP TABLE "_journal_v_locales" CASCADE;
  DROP TABLE "_journal_v" CASCADE;
  DROP TABLE "_journal_v_version_tags" CASCADE;
  DROP TABLE "_education_v_locales" CASCADE;
  DROP TABLE "_education_v" CASCADE;
  DROP TABLE "_experiences_v_rels" CASCADE;
  DROP TABLE "_experiences_v_locales" CASCADE;
  DROP TABLE "_experiences_v" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  ALTER TABLE "projects_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "projects_locales" ALTER COLUMN "short_description" SET NOT NULL;
  ALTER TABLE "projects_locales" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "experiences_locales" ALTER COLUMN "position" SET NOT NULL;
  ALTER TABLE "experiences_locales" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "education_locales" ALTER COLUMN "degree" SET NOT NULL;
  ALTER TABLE "experiences" ALTER COLUMN "company_id" SET NOT NULL;
  ALTER TABLE "experiences" ALTER COLUMN "start_date" SET NOT NULL;
  ALTER TABLE "education" ALTER COLUMN "school_id" SET NOT NULL;
  ALTER TABLE "education" ALTER COLUMN "start_date" SET NOT NULL;
  ALTER TABLE "journal_tags" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "short_description" SET NOT NULL;
  ALTER TABLE "journal_locales" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "date" SET NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "slug" SET NOT NULL;
  DROP TYPE "public"."enum__projects_v_version_mockup_frame";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_published_locale";
  DROP TYPE "public"."enum__experiences_v_version_status";
  DROP TYPE "public"."enum__experiences_v_published_locale";
  DROP TYPE "public"."enum__education_v_version_status";
  DROP TYPE "public"."enum__education_v_published_locale";
  DROP TYPE "public"."enum__journal_v_version_status";
  DROP TYPE "public"."enum__journal_v_published_locale";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)

  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_visibility" AS ENUM('public', 'private');
  CREATE TYPE "public"."enum_journal_visibility" AS ENUM('public', 'private');
  ALTER TABLE "projects" ADD COLUMN "visibility" "enum_projects_visibility" DEFAULT 'public' NOT NULL;
  ALTER TABLE "journal" ADD COLUMN "visibility" "enum_journal_visibility" DEFAULT 'public' NOT NULL;
  UPDATE "projects" SET "visibility" = 'private' WHERE "_status" = 'draft';
  UPDATE "journal" SET "visibility" = 'private' WHERE "_status" = 'draft';
  DROP INDEX "projects__status_idx";
  DROP INDEX "journal__status_idx";
  DROP INDEX "experiences__status_idx";
  DROP INDEX "education__status_idx";
  ALTER TABLE "projects" DROP COLUMN "_status";
  ALTER TABLE "journal" DROP COLUMN "_status";
  ALTER TABLE "experiences" DROP COLUMN "_status";
  ALTER TABLE "education" DROP COLUMN "_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_journal_status";
  DROP TYPE "public"."enum_experiences_status";
  DROP TYPE "public"."enum_education_status";
  ALTER TYPE "public"."enum_projects_project_status" RENAME TO "enum_projects_status";`)
}
