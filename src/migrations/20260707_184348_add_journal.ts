import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_journal_category" AS ENUM('sport', 'travel', 'achievement', 'personal', 'event', 'other');
  CREATE TYPE "public"."enum_journal_visibility" AS ENUM('public', 'private');
  CREATE TABLE "journal_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "journal" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_journal_category" DEFAULT 'personal' NOT NULL,
  	"cover_image_id" integer,
  	"date" timestamp(3) with time zone NOT NULL,
  	"featured" boolean DEFAULT false,
  	"visibility" "enum_journal_visibility" DEFAULT 'public' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "journal_locales" (
  	"title" varchar NOT NULL,
  	"short_description" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"location" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "journal_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "journal_id" integer;
  ALTER TABLE "journal_tags" ADD CONSTRAINT "journal_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journal" ADD CONSTRAINT "journal_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_locales" ADD CONSTRAINT "journal_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal_locales" ADD CONSTRAINT "journal_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "journal_tags_order_idx" ON "journal_tags" USING btree ("_order");
  CREATE INDEX "journal_tags_parent_id_idx" ON "journal_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "journal_slug_idx" ON "journal" USING btree ("slug");
  CREATE INDEX "journal_cover_image_idx" ON "journal" USING btree ("cover_image_id");
  CREATE INDEX "journal_featured_idx" ON "journal" USING btree ("featured");
  CREATE INDEX "journal_updated_at_idx" ON "journal" USING btree ("updated_at");
  CREATE INDEX "journal_created_at_idx" ON "journal" USING btree ("created_at");
  CREATE INDEX "journal_meta_meta_image_idx" ON "journal_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "journal_locales_locale_parent_id_unique" ON "journal_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "journal_rels_order_idx" ON "journal_rels" USING btree ("order");
  CREATE INDEX "journal_rels_parent_idx" ON "journal_rels" USING btree ("parent_id");
  CREATE INDEX "journal_rels_path_idx" ON "journal_rels" USING btree ("path");
  CREATE INDEX "journal_rels_media_id_idx" ON "journal_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journal_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_journal_id_idx" ON "payload_locked_documents_rels" USING btree ("journal_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "journal_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "journal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "journal_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "journal_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "journal_tags" CASCADE;
  DROP TABLE "journal" CASCADE;
  DROP TABLE "journal_locales" CASCADE;
  DROP TABLE "journal_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_journal_fk";
  
  DROP INDEX "payload_locked_documents_rels_journal_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "journal_id";
  DROP TYPE "public"."enum_journal_category";
  DROP TYPE "public"."enum_journal_visibility";`)
}
