import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Indexes Payload 3.91 adds on its own, with no config change on our side:
// `_parent_id` on every `_locales` table ("drizzle: add _parent_id index to
// localized tables", payloadcms/payload#18724). Reading a localized document
// joins its `_locales` rows on that column, which had no index of its own
// (the unique index on `_locale` + `_parent_id` leads with `_locale`).
// Indexes only: no data moves, and `down` drops exactly these.
// Found by tests/int/schemaDrift.int.spec.ts.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "about_locales_parent_id_idx" ON "about_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "companies_locales_parent_id_idx" ON "companies_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "contact_locales_parent_id_idx" ON "contact_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "education_locales_parent_id_idx" ON "education_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "experiences_locales_parent_id_idx" ON "experiences_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_links_locales_parent_id_idx" ON "footer_links_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_locales_parent_id_idx" ON "footer_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "hero_locales_parent_id_idx" ON "hero_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "journal_locales_parent_id_idx" ON "journal_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "navigation_items_locales_parent_id_idx" ON "navigation_items_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "schools_locales_parent_id_idx" ON "schools_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "sections_content_locales_parent_id_idx" ON "sections_content_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "testimonials_locales_parent_id_idx" ON "testimonials_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "about_locales_parent_id_idx";
  DROP INDEX IF EXISTS "categories_locales_parent_id_idx";
  DROP INDEX IF EXISTS "companies_locales_parent_id_idx";
  DROP INDEX IF EXISTS "contact_locales_parent_id_idx";
  DROP INDEX IF EXISTS "education_locales_parent_id_idx";
  DROP INDEX IF EXISTS "experiences_locales_parent_id_idx";
  DROP INDEX IF EXISTS "footer_links_locales_parent_id_idx";
  DROP INDEX IF EXISTS "footer_locales_parent_id_idx";
  DROP INDEX IF EXISTS "hero_locales_parent_id_idx";
  DROP INDEX IF EXISTS "journal_locales_parent_id_idx";
  DROP INDEX IF EXISTS "navigation_items_locales_parent_id_idx";
  DROP INDEX IF EXISTS "projects_locales_parent_id_idx";
  DROP INDEX IF EXISTS "schools_locales_parent_id_idx";
  DROP INDEX IF EXISTS "sections_content_locales_parent_id_idx";
  DROP INDEX IF EXISTS "settings_locales_parent_id_idx";
  DROP INDEX IF EXISTS "testimonials_locales_parent_id_idx";`)
}
