import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const TECH_CATEGORIES = [
  { slug: 'frontend', fr: 'Frontend', en: 'Frontend' },
  { slug: 'backend', fr: 'Backend', en: 'Backend' },
  { slug: 'mobile', fr: 'Mobile', en: 'Mobile' },
  { slug: 'devops', fr: 'DevOps', en: 'DevOps' },
  { slug: 'tools', fr: 'Outils', en: 'Tools' },
  { slug: 'design', fr: 'Design', en: 'Design' },
  { slug: 'other', fr: 'Autre', en: 'Other' },
]

const JOURNAL_CATEGORIES = [
  { slug: 'sport', fr: 'Sport', en: 'Sport' },
  { slug: 'travel', fr: 'Voyage', en: 'Travel' },
  { slug: 'achievement', fr: 'Accomplissement', en: 'Achievement' },
  { slug: 'personal', fr: 'Personnel', en: 'Personal' },
  { slug: 'event', fr: 'Événement', en: 'Event' },
  { slug: 'other', fr: 'Autre', en: 'Other' },
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Schema for the new `categories` collection.
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_group" AS ENUM('tech', 'project', 'journal');
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"group" "enum_categories_group" NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_group_idx" ON "categories" USING btree ("group");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");`)

  // 2. Seed categories via the Local API so the localized `name` field is written correctly.
  const techIdBySlug: Record<string, number> = {}
  const journalIdBySlug: Record<string, number> = {}

  for (const cat of TECH_CATEGORIES) {
    const created = await payload.create({
      collection: 'categories',
      data: { name: cat.fr, slug: `tech-${cat.slug}`, group: 'tech' },
      locale: 'fr',
      req,
    })
    await payload.update({
      collection: 'categories',
      id: created.id,
      data: { name: cat.en },
      locale: 'en',
      req,
    })
    techIdBySlug[cat.slug] = created.id as number
  }

  for (const cat of JOURNAL_CATEGORIES) {
    const created = await payload.create({
      collection: 'categories',
      data: { name: cat.fr, slug: `journal-${cat.slug}`, group: 'journal' },
      locale: 'fr',
      req,
    })
    await payload.update({
      collection: 'categories',
      id: created.id,
      data: { name: cat.en },
      locale: 'en',
      req,
    })
    journalIdBySlug[cat.slug] = created.id as number
  }

  // Project categories are free text historically, so seed from whatever distinct values exist.
  const existingProjectCategories = await db.execute(
    sql`SELECT DISTINCT category FROM projects_locales WHERE category IS NOT NULL;`,
  )
  const projectIdByName: Record<string, number> = {}

  for (const row of existingProjectCategories.rows as { category: string }[]) {
    const name = row.category
    const slug = `project-${slugify(name) || Object.keys(projectIdByName).length}`
    const created = await payload.create({
      collection: 'categories',
      data: { name, slug, group: 'project' },
      locale: 'fr',
      req,
    })
    await payload.update({
      collection: 'categories',
      id: created.id,
      data: { name },
      locale: 'en',
      req,
    })
    projectIdByName[name] = created.id as number
  }

  // 3. Add the new relationship columns and backfill them from the legacy values.
  await db.execute(sql`
   ALTER TABLE "skills" ADD COLUMN "category_id" integer;
  ALTER TABLE "technologies" ADD COLUMN "category_id" integer;
  ALTER TABLE "journal" ADD COLUMN "category_id" integer;
  ALTER TABLE "projects" ADD COLUMN "category_id" integer;`)

  for (const [slugValue, id] of Object.entries(techIdBySlug)) {
    await db.execute(
      sql`UPDATE "skills" SET "category_id" = ${id} WHERE "category"::text = ${slugValue};`,
    )
    await db.execute(
      sql`UPDATE "technologies" SET "category_id" = ${id} WHERE "category"::text = ${slugValue};`,
    )
  }

  for (const [slugValue, id] of Object.entries(journalIdBySlug)) {
    await db.execute(
      sql`UPDATE "journal" SET "category_id" = ${id} WHERE "category"::text = ${slugValue};`,
    )
  }

  for (const [name, id] of Object.entries(projectIdByName)) {
    await db.execute(sql`
      UPDATE "projects" SET "category_id" = ${id}
      WHERE "id" IN (SELECT "_parent_id" FROM "projects_locales" WHERE "category" = ${name});
    `)
  }

  // 4. Constraints, indexes, and drop the legacy columns/enums.
  await db.execute(sql`
   ALTER TABLE "skills" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "technologies" ADD CONSTRAINT "technologies_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journal" ADD CONSTRAINT "journal_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category_id");
  CREATE INDEX "technologies_category_idx" ON "technologies" USING btree ("category_id");
  CREATE INDEX "journal_category_idx" ON "journal" USING btree ("category_id");
  CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");
  ALTER TABLE "skills" DROP COLUMN "category";
  ALTER TABLE "technologies" DROP COLUMN "category";
  ALTER TABLE "journal" DROP COLUMN "category";
  ALTER TABLE "projects_locales" DROP COLUMN "category";
  DROP TYPE "public"."enum_skills_category";
  DROP TYPE "public"."enum_technologies_category";
  DROP TYPE "public"."enum_journal_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Restores the old shape (columns + enums). Does not attempt to restore
  // exact historical per-row values — acceptable for this project.
  await db.execute(sql`
   ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "skills_category_id_categories_id_fk";
  ALTER TABLE "technologies" DROP CONSTRAINT IF EXISTS "technologies_category_id_categories_id_fk";
  ALTER TABLE "journal" DROP CONSTRAINT IF EXISTS "journal_category_id_categories_id_fk";
  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_category_id_categories_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_categories_fk";

  CREATE TYPE "public"."enum_skills_category" AS ENUM('frontend', 'backend', 'mobile', 'devops', 'tools', 'design', 'other');
  CREATE TYPE "public"."enum_technologies_category" AS ENUM('frontend', 'backend', 'mobile', 'devops', 'tools', 'other');
  CREATE TYPE "public"."enum_journal_category" AS ENUM('sport', 'travel', 'achievement', 'personal', 'event', 'other');

  ALTER TABLE "skills" ADD COLUMN "category" "enum_skills_category";
  ALTER TABLE "technologies" ADD COLUMN "category" "enum_technologies_category";
  ALTER TABLE "journal" ADD COLUMN "category" "enum_journal_category" DEFAULT 'personal';
  ALTER TABLE "projects_locales" ADD COLUMN "category" varchar;

  ALTER TABLE "skills" DROP COLUMN "category_id";
  ALTER TABLE "technologies" DROP COLUMN "category_id";
  ALTER TABLE "journal" DROP COLUMN "category_id";
  ALTER TABLE "projects" DROP COLUMN "category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "categories_id";

  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TYPE "public"."enum_categories_group";

  ALTER TABLE "skills" ALTER COLUMN "category" SET NOT NULL;
  ALTER TABLE "journal" ALTER COLUMN "category" SET NOT NULL;`)
}
