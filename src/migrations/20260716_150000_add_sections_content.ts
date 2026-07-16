import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "sections_content" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"updated_at" timestamp(3) with time zone,
   	"created_at" timestamp(3) with time zone
   );

  CREATE TABLE IF NOT EXISTS "sections_content_locales" (
   	"projects_eyebrow" varchar DEFAULT 'Selected work',
   	"projects_title" varchar DEFAULT 'Projects' NOT NULL,
   	"projects_description" varchar DEFAULT 'Selected work shaped for fast-moving products, thoughtful UX, and reliable engineering.',
   	"experience_eyebrow" varchar DEFAULT 'Background',
   	"experience_title" varchar DEFAULT 'Experience' NOT NULL,
   	"experience_description" varchar DEFAULT 'A track record of building product experiences with strong technical ownership.',
   	"education_eyebrow" varchar DEFAULT 'Education',
   	"education_title" varchar DEFAULT 'Education' NOT NULL,
   	"education_description" varchar DEFAULT 'Academic background and continuing learning paths managed from Payload CMS.',
   	"skills_eyebrow" varchar DEFAULT 'Capabilities',
   	"skills_title" varchar DEFAULT 'Skills' NOT NULL,
   	"skills_description" varchar DEFAULT 'A toolkit refined for modern product development across frontend, backend, and delivery.',
   	"testimonials_eyebrow" varchar DEFAULT 'Testimonials',
   	"testimonials_title" varchar DEFAULT 'What people say' NOT NULL,
   	"testimonials_description" varchar DEFAULT 'Feedback from people I''ve worked with on shipped products.',
   	"journal_eyebrow" varchar DEFAULT 'Beyond code',
   	"journal_title" varchar DEFAULT 'Journal' NOT NULL,
   	"journal_description" varchar DEFAULT 'Travel, sport, achievements, and milestones — another side of the journey.',
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" integer NOT NULL
   );

  ALTER TABLE "sections_content_locales" ADD CONSTRAINT "sections_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sections_content"("id") ON DELETE cascade ON UPDATE no action;

  CREATE UNIQUE INDEX IF NOT EXISTS "sections_content_locales_locale_parent_id_unique" ON "sections_content_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "sections_content_locales" CASCADE;
  DROP TABLE IF EXISTS "sections_content" CASCADE;`)
}
