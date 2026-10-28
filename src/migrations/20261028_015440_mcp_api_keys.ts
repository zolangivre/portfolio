import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The MCP plugin's API keys (`payload-mcp-api-keys`): one row per key, its
// user, and one column per capability it may use. Plus the relationship
// columns every collection gets in the locked-documents and preferences
// tables. Drizzle's own SQL from the schema-drift test. down() drops the keys:
// MCP clients using them stop working.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_mcp_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"label" varchar,
	"description" varchar,
	"projects_find" boolean DEFAULT false,
	"projects_create" boolean DEFAULT false,
	"projects_update" boolean DEFAULT false,
	"journal_find" boolean DEFAULT false,
	"journal_create" boolean DEFAULT false,
	"journal_update" boolean DEFAULT false,
	"experiences_find" boolean DEFAULT false,
	"experiences_create" boolean DEFAULT false,
	"experiences_update" boolean DEFAULT false,
	"education_find" boolean DEFAULT false,
	"education_create" boolean DEFAULT false,
	"education_update" boolean DEFAULT false,
	"testimonials_find" boolean DEFAULT false,
	"testimonials_create" boolean DEFAULT false,
	"testimonials_update" boolean DEFAULT false,
	"skills_find" boolean DEFAULT false,
	"skills_create" boolean DEFAULT false,
	"skills_update" boolean DEFAULT false,
	"technologies_find" boolean DEFAULT false,
	"technologies_create" boolean DEFAULT false,
	"technologies_update" boolean DEFAULT false,
	"categories_find" boolean DEFAULT false,
	"categories_create" boolean DEFAULT false,
	"categories_update" boolean DEFAULT false,
	"companies_find" boolean DEFAULT false,
	"companies_create" boolean DEFAULT false,
	"companies_update" boolean DEFAULT false,
	"schools_find" boolean DEFAULT false,
	"schools_create" boolean DEFAULT false,
	"schools_update" boolean DEFAULT false,
	"hero_find" boolean DEFAULT false,
	"hero_update" boolean DEFAULT false,
	"about_find" boolean DEFAULT false,
	"about_update" boolean DEFAULT false,
	"contact_find" boolean DEFAULT false,
	"contact_update" boolean DEFAULT false,
	"navigation_find" boolean DEFAULT false,
	"navigation_update" boolean DEFAULT false,
	"footer_find" boolean DEFAULT false,
	"footer_update" boolean DEFAULT false,
	"settings_find" boolean DEFAULT false,
	"settings_update" boolean DEFAULT false,
	"sections_content_find" boolean DEFAULT false,
	"sections_content_update" boolean DEFAULT false,
	"sections_visibility_find" boolean DEFAULT false,
	"sections_visibility_update" boolean DEFAULT false,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"enable_a_p_i_key" boolean,
	"api_key" varchar,
	"api_key_index" varchar
);
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  DROP INDEX IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  DROP TABLE IF EXISTS "payload_mcp_api_keys" CASCADE;`)
}
