import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The redirects plugin's collection (`redirects`): one row per old URL, where
// it leads (a project or journal entry through `redirects_rels`, or a custom
// URL), plus the relationship column every collection gets in the
// locked-documents table. Drizzle's own SQL from the schema-drift test.
// down() drops the redirects: old URLs answer 404 again.
//
// First of all, it clears the leftovers of an old redirects trial made
// through a dev push and never committed (the local database had them, with
// an extra `type` column; staging's and production's may too): the two
// tables, their enums and the locked-documents column. On a database built
// from the migrations alone, that step does nothing. A leftover redirects
// table that holds rows stops the migration instead of being dropped.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  DECLARE has_rows boolean;
  BEGIN
    IF to_regclass('public.redirects') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM redirects)' INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'Leftover table redirects from an old redirects trial holds rows: back it up and drop it, then migrate again.';
      END IF;
    END IF;
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
    DROP TABLE IF EXISTS "redirects_rels" CASCADE;
    DROP TABLE IF EXISTS "redirects" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_redirects_to_type";
    DROP TYPE IF EXISTS "public"."enum_redirects_type";
  END $$;`)

  await db.execute(sql`
   CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from" varchar NOT NULL,
	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
	"to_url" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

  CREATE TABLE "redirects_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"journal_id" integer,
	"projects_id" integer
);

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_journal_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_journal_id_idx" ON "redirects_rels" USING btree ("journal_id");
  CREATE INDEX "redirects_rels_projects_id_idx" ON "redirects_rels" USING btree ("projects_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirects_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_redirects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
  DROP TABLE IF EXISTS "redirects_rels" CASCADE;
  DROP TABLE IF EXISTS "redirects" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_redirects_to_type";`)
}
