import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Drafts, autosave and scheduled publishing on the eight globals
// (collections/drafts.ts), the second half of what 20261027_175816 did for
// the content collections.
//
// The schema is Drizzle's own SQL from the schema-drift test, with one fix:
// the Lexical default of `version_testimonials_description` contains
// "I've", which Drizzle leaves unescaped (as it did for the main table in
// 20260716_150000_add_sections_content). Drafts may be incomplete, so the
// fields `required` used to make NOT NULL lose it.
//
// It starts by clearing the leftovers of an old drafts trial on the globals
// (dev push, never committed — staging's database had them for the
// collections): version tables if empty (one with rows stops the migration,
// named in the error), `_status` columns and their enums. On a database built
// from the migrations alone, nothing matches.
//
// Every global is live today, so `_status` starts as published. Each one
// then gets one version, a copy of its main row: the admin opens a global
// with drafts on its latest version, and would otherwise show the fields
// empty (or default) while the site still renders the real content.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  DECLARE t text; has_rows boolean;
  BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename ~ '^_(about|contact|footer|settings|hero|navigation|sections_content|sections_visibility)_v' LOOP
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I)', t) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'Leftover table % from an old drafts trial holds rows: back it up and drop it, then migrate again.', t;
      END IF;
    END LOOP;
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename ~ '^_(about|contact|footer|settings|hero|navigation|sections_content|sections_visibility)_v' LOOP
      EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t);
    END LOOP;
    FOREACH t IN ARRAY ARRAY['about', 'contact', 'footer', 'settings', 'hero', 'navigation', 'sections_content', 'sections_visibility'] LOOP
      EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "_status"', t);
    END LOOP;
    FOR t IN SELECT typname FROM pg_type
      WHERE typname ~ '^enum__(about|contact|footer|settings|hero|navigation|sections_content|sections_visibility)_v_'
        OR typname ~ '^enum_(about|contact|footer|settings|hero|navigation|sections_content|sections_visibility)_status$' LOOP
      EXECUTE format('DROP TYPE %I', t);
    END LOOP;
  END $$;`)

  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__settings_v_version_social_links_platform" AS ENUM('github', 'linkedin', 'x', 'instagram', 'dribbble', 'other');
  CREATE TYPE "public"."enum__settings_v_version_theme_primary_color" AS ENUM('orange', 'coral', 'red', 'crimson', 'rose', 'pink', 'purple', 'violet', 'indigo', 'blue', 'sky', 'cyan', 'teal', 'mint', 'emerald', 'green', 'lime', 'olive', 'gold', 'amber', 'yellow', 'slate', 'gray', 'neutral');
  CREATE TYPE "public"."enum__settings_v_version_theme_accent_color" AS ENUM('orange', 'coral', 'red', 'crimson', 'rose', 'pink', 'purple', 'violet', 'indigo', 'blue', 'sky', 'cyan', 'teal', 'mint', 'emerald', 'green', 'lime', 'olive', 'gold', 'amber', 'yellow', 'slate', 'gray', 'neutral');
  CREATE TYPE "public"."enum__settings_v_version_theme_default_theme" AS ENUM('light', 'dark', 'system');
  CREATE TYPE "public"."enum__settings_v_version_theme_cursor_effect" AS ENUM('ring', 'trail');
  CREATE TYPE "public"."enum__settings_v_version_theme_background_style" AS ENUM('gradient', 'photo', 'spatial', 'playground', 'daylight', 'colorBlocks');
  CREATE TYPE "public"."enum__settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__settings_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_hero_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hero_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hero_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_about_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_contact_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_footer_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_sections_visibility_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sections_visibility_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sections_visibility_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_sections_content_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sections_content_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sections_content_v_published_locale" AS ENUM('fr', 'en');
  CREATE TABLE "_settings_v_version_theme_background_photos" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"photo_id" integer,
	"_uuid" varchar
);
  CREATE TABLE "_settings_v_version_social_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"platform" "enum__settings_v_version_social_links_platform",
	"url" varchar,
	"icon_id" integer,
	"_uuid" varchar
);
  CREATE TABLE "_settings_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_name" varchar DEFAULT 'Alex Porter',
	"version_photo_id" integer,
	"version_logo_id" integer,
	"version_theme_primary_color" "enum__settings_v_version_theme_primary_color" DEFAULT 'orange',
	"version_theme_accent_color" "enum__settings_v_version_theme_accent_color",
	"version_theme_default_theme" "enum__settings_v_version_theme_default_theme" DEFAULT 'system',
	"version_theme_cursor_effect" "enum__settings_v_version_theme_cursor_effect" DEFAULT 'ring',
	"version_theme_background_style" "enum__settings_v_version_theme_background_style" DEFAULT 'gradient',
	"version_contact_email" varchar DEFAULT 'hello@yourdomain.com',
	"version_seo_default_title" varchar DEFAULT 'Developer Portfolio',
	"version_seo_default_image_id" integer,
	"version__status" "enum__settings_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__settings_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_settings_v_locales" (
	"version_profession" varchar DEFAULT 'Full-stack developer',
	"version_seo_default_description" varchar DEFAULT 'Professional developer portfolio powered by Payload CMS and Next.js.',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_hero_v_version_highlights" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"_uuid" varchar
);
  CREATE TABLE "_hero_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_availability_enabled" boolean DEFAULT false,
	"version_primary_cta_href" varchar DEFAULT '#projects',
	"version_secondary_cta_href" varchar DEFAULT '#contact',
	"version__status" "enum__hero_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__hero_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_hero_v_locales" (
	"version_availability_label" varchar,
	"version_eyebrow" varchar DEFAULT 'Full-stack developer',
	"version_title" varchar DEFAULT 'Building polished digital products with calm, modern engineering.',
	"version_description" jsonb,
	"version_primary_cta_label" varchar DEFAULT 'View projects',
	"version_secondary_cta_label" varchar DEFAULT 'Let’s talk',
	"version_resume_cta_label" varchar DEFAULT 'Download CV',
	"version_resume_cta_file_id" integer,
	"version_meta_title" varchar,
	"version_meta_description" varchar,
	"version_meta_image_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_about_v_version_point_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"content" jsonb,
	"_uuid" varchar
);
  CREATE TABLE "_about_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_portrait_id" integer,
	"version__status" "enum__about_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__about_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_about_v_locales" (
	"version_eyebrow" varchar DEFAULT 'About',
	"version_title" varchar DEFAULT 'Designing thoughtful products with engineering depth.',
	"version_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"A product-minded engineer focused on building fast, reliable experiences from concept to launch.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_contact_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version__status" "enum__contact_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__contact_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_contact_v_locales" (
	"version_eyebrow" varchar DEFAULT 'Contact',
	"version_title" varchar DEFAULT 'Let’s build something meaningful.',
	"version_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"Available for select freelance work, product collaborations, and full-stack product builds.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_success_message" varchar DEFAULT 'Thanks for reaching out — I’ll get back to you shortly.',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_navigation_v_version_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"href" varchar,
	"_uuid" varchar
);
  CREATE TABLE "_navigation_v_version_items_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_navigation_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version__status" "enum__navigation_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__navigation_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_footer_v_version_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"href" varchar,
	"_uuid" varchar
);
  CREATE TABLE "_footer_v_version_links_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_footer_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version__status" "enum__footer_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__footer_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_footer_v_locales" (
	"version_text" varchar DEFAULT 'Crafted for ambitious products, polished interfaces, and reliable engineering.',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  CREATE TABLE "_sections_visibility_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_hero" boolean DEFAULT true,
	"version_about" boolean DEFAULT true,
	"version_projects" boolean DEFAULT true,
	"version_experience" boolean DEFAULT true,
	"version_education" boolean DEFAULT true,
	"version_skills" boolean DEFAULT true,
	"version_testimonials" boolean DEFAULT true,
	"version_contact" boolean DEFAULT true,
	"version_journal" boolean DEFAULT true,
	"version__status" "enum__sections_visibility_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__sections_visibility_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_sections_content_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version__status" "enum__sections_content_v_version_status" DEFAULT 'draft',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__sections_content_v_published_locale",
	"latest" boolean,
	"autosave" boolean
);
  CREATE TABLE "_sections_content_v_locales" (
	"version_projects_eyebrow" varchar DEFAULT 'Selected work',
	"version_projects_title" varchar DEFAULT 'Projects',
	"version_projects_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"Selected work shaped for fast-moving products, thoughtful UX, and reliable engineering.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_experience_eyebrow" varchar DEFAULT 'Background',
	"version_experience_title" varchar DEFAULT 'Experience',
	"version_experience_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"A track record of building product experiences with strong technical ownership.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_education_eyebrow" varchar DEFAULT 'Education',
	"version_education_title" varchar DEFAULT 'Education',
	"version_education_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"Academic background and continuing learning paths managed from Payload CMS.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_skills_eyebrow" varchar DEFAULT 'Capabilities',
	"version_skills_title" varchar DEFAULT 'Skills',
	"version_skills_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"A toolkit refined for modern product development across frontend, backend, and delivery.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_testimonials_eyebrow" varchar DEFAULT 'Testimonials',
	"version_testimonials_title" varchar DEFAULT 'What people say',
	"version_testimonials_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"Feedback from people I''ve worked with on shipped products.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"version_journal_eyebrow" varchar DEFAULT 'Beyond code',
	"version_journal_title" varchar DEFAULT 'Journal',
	"version_journal_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":"ltr","children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":"ltr","textFormat":0,"textStyle":"","children":[{"type":"text","text":"Travel, sport, achievements, and milestones — another side of the journey.","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);
  ALTER TABLE "hero_highlights" ALTER COLUMN "value" DROP NOT NULL;
  ALTER TABLE "navigation_items" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "navigation_items_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "footer_links" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "footer_links_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "about_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "contact_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "settings_social_links" ALTER COLUMN "platform" DROP NOT NULL;
  ALTER TABLE "settings_social_links" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "hero_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "theme_primary_color" DROP NOT NULL;
  ALTER TABLE "about_point_groups" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "projects_title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "experience_title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "education_title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "skills_title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "testimonials_title" DROP NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "journal_title" DROP NOT NULL;
  ALTER TABLE "about" ADD COLUMN "_status" "enum_about_status" DEFAULT 'draft';
  ALTER TABLE "navigation" ADD COLUMN "_status" "enum_navigation_status" DEFAULT 'draft';
  ALTER TABLE "footer" ADD COLUMN "_status" "enum_footer_status" DEFAULT 'draft';
  ALTER TABLE "contact" ADD COLUMN "_status" "enum_contact_status" DEFAULT 'draft';
  ALTER TABLE "hero" ADD COLUMN "_status" "enum_hero_status" DEFAULT 'draft';
  ALTER TABLE "sections_content" ADD COLUMN "_status" "enum_sections_content_status" DEFAULT 'draft';
  ALTER TABLE "sections_visibility" ADD COLUMN "_status" "enum_sections_visibility_status" DEFAULT 'draft';
  ALTER TABLE "settings" ADD COLUMN "_status" "enum_settings_status" DEFAULT 'draft';
  ALTER TABLE "_settings_v_version_theme_background_photos" ADD CONSTRAINT "_settings_v_version_theme_background_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settings_v_version_theme_background_photos" ADD CONSTRAINT "_settings_v_version_theme_background_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_settings_v_version_social_links" ADD CONSTRAINT "_settings_v_version_social_links_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settings_v_version_social_links" ADD CONSTRAINT "_settings_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_settings_v" ADD CONSTRAINT "_settings_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settings_v" ADD CONSTRAINT "_settings_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settings_v" ADD CONSTRAINT "_settings_v_version_seo_default_image_id_media_id_fk" FOREIGN KEY ("version_seo_default_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settings_v_locales" ADD CONSTRAINT "_settings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hero_v_version_highlights" ADD CONSTRAINT "_hero_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hero_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_version_resume_cta_file_id_media_id_fk" FOREIGN KEY ("version_resume_cta_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hero_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_v_version_point_groups" ADD CONSTRAINT "_about_v_version_point_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_v" ADD CONSTRAINT "_about_v_version_portrait_id_media_id_fk" FOREIGN KEY ("version_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_v_locales" ADD CONSTRAINT "_about_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v_locales" ADD CONSTRAINT "_contact_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items_locales" ADD CONSTRAINT "_navigation_v_version_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_links" ADD CONSTRAINT "_footer_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_links_locales" ADD CONSTRAINT "_footer_v_version_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v_version_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_locales" ADD CONSTRAINT "_footer_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sections_content_v_locales" ADD CONSTRAINT "_sections_content_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sections_content_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_settings_v_version_theme_background_photos_order_idx" ON "_settings_v_version_theme_background_photos" USING btree ("_order");
  CREATE INDEX "_settings_v_version_theme_background_photos_parent_id_idx" ON "_settings_v_version_theme_background_photos" USING btree ("_parent_id");
  CREATE INDEX "_settings_v_version_theme_background_photos_photo_idx" ON "_settings_v_version_theme_background_photos" USING btree ("photo_id");
  CREATE INDEX "_settings_v_version_social_links_order_idx" ON "_settings_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_settings_v_version_social_links_parent_id_idx" ON "_settings_v_version_social_links" USING btree ("_parent_id");
  CREATE INDEX "_settings_v_version_social_links_icon_idx" ON "_settings_v_version_social_links" USING btree ("icon_id");
  CREATE INDEX "_settings_v_version_version_photo_idx" ON "_settings_v" USING btree ("version_photo_id");
  CREATE INDEX "_settings_v_version_version_logo_idx" ON "_settings_v" USING btree ("version_logo_id");
  CREATE INDEX "_settings_v_version_seo_version_seo_default_image_idx" ON "_settings_v" USING btree ("version_seo_default_image_id");
  CREATE INDEX "_settings_v_version_version__status_idx" ON "_settings_v" USING btree ("version__status");
  CREATE INDEX "_settings_v_created_at_idx" ON "_settings_v" USING btree ("created_at");
  CREATE INDEX "_settings_v_updated_at_idx" ON "_settings_v" USING btree ("updated_at");
  CREATE INDEX "_settings_v_snapshot_idx" ON "_settings_v" USING btree ("snapshot");
  CREATE INDEX "_settings_v_published_locale_idx" ON "_settings_v" USING btree ("published_locale");
  CREATE INDEX "_settings_v_latest_idx" ON "_settings_v" USING btree ("latest");
  CREATE INDEX "_settings_v_autosave_idx" ON "_settings_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_settings_v_locales_locale_parent_id_unique" ON "_settings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_settings_v_locales_parent_id_idx" ON "_settings_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_hero_v_version_highlights_order_idx" ON "_hero_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_hero_v_version_highlights_parent_id_idx" ON "_hero_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_hero_v_version_highlights_locale_idx" ON "_hero_v_version_highlights" USING btree ("_locale");
  CREATE INDEX "_hero_v_version_version__status_idx" ON "_hero_v" USING btree ("version__status");
  CREATE INDEX "_hero_v_created_at_idx" ON "_hero_v" USING btree ("created_at");
  CREATE INDEX "_hero_v_updated_at_idx" ON "_hero_v" USING btree ("updated_at");
  CREATE INDEX "_hero_v_snapshot_idx" ON "_hero_v" USING btree ("snapshot");
  CREATE INDEX "_hero_v_published_locale_idx" ON "_hero_v" USING btree ("published_locale");
  CREATE INDEX "_hero_v_latest_idx" ON "_hero_v" USING btree ("latest");
  CREATE INDEX "_hero_v_autosave_idx" ON "_hero_v" USING btree ("autosave");
  CREATE INDEX "_hero_v_version_resume_cta_version_resume_cta_file_idx" ON "_hero_v_locales" USING btree ("version_resume_cta_file_id","_locale");
  CREATE INDEX "_hero_v_version_meta_version_meta_image_idx" ON "_hero_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_hero_v_locales_locale_parent_id_unique" ON "_hero_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hero_v_locales_parent_id_idx" ON "_hero_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_about_v_version_point_groups_order_idx" ON "_about_v_version_point_groups" USING btree ("_order");
  CREATE INDEX "_about_v_version_point_groups_parent_id_idx" ON "_about_v_version_point_groups" USING btree ("_parent_id");
  CREATE INDEX "_about_v_version_point_groups_locale_idx" ON "_about_v_version_point_groups" USING btree ("_locale");
  CREATE INDEX "_about_v_version_version_portrait_idx" ON "_about_v" USING btree ("version_portrait_id");
  CREATE INDEX "_about_v_version_version__status_idx" ON "_about_v" USING btree ("version__status");
  CREATE INDEX "_about_v_created_at_idx" ON "_about_v" USING btree ("created_at");
  CREATE INDEX "_about_v_updated_at_idx" ON "_about_v" USING btree ("updated_at");
  CREATE INDEX "_about_v_snapshot_idx" ON "_about_v" USING btree ("snapshot");
  CREATE INDEX "_about_v_published_locale_idx" ON "_about_v" USING btree ("published_locale");
  CREATE INDEX "_about_v_latest_idx" ON "_about_v" USING btree ("latest");
  CREATE INDEX "_about_v_autosave_idx" ON "_about_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_about_v_locales_locale_parent_id_unique" ON "_about_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_v_locales_parent_id_idx" ON "_about_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_contact_v_version_version__status_idx" ON "_contact_v" USING btree ("version__status");
  CREATE INDEX "_contact_v_created_at_idx" ON "_contact_v" USING btree ("created_at");
  CREATE INDEX "_contact_v_updated_at_idx" ON "_contact_v" USING btree ("updated_at");
  CREATE INDEX "_contact_v_snapshot_idx" ON "_contact_v" USING btree ("snapshot");
  CREATE INDEX "_contact_v_published_locale_idx" ON "_contact_v" USING btree ("published_locale");
  CREATE INDEX "_contact_v_latest_idx" ON "_contact_v" USING btree ("latest");
  CREATE INDEX "_contact_v_autosave_idx" ON "_contact_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_contact_v_locales_locale_parent_id_unique" ON "_contact_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_contact_v_locales_parent_id_idx" ON "_contact_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_items_order_idx" ON "_navigation_v_version_items" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_items_parent_id_idx" ON "_navigation_v_version_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_navigation_v_version_items_locales_locale_parent_id_unique" ON "_navigation_v_version_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_navigation_v_version_items_locales_parent_id_idx" ON "_navigation_v_version_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_snapshot_idx" ON "_navigation_v" USING btree ("snapshot");
  CREATE INDEX "_navigation_v_published_locale_idx" ON "_navigation_v" USING btree ("published_locale");
  CREATE INDEX "_navigation_v_latest_idx" ON "_navigation_v" USING btree ("latest");
  CREATE INDEX "_navigation_v_autosave_idx" ON "_navigation_v" USING btree ("autosave");
  CREATE INDEX "_footer_v_version_links_order_idx" ON "_footer_v_version_links" USING btree ("_order");
  CREATE INDEX "_footer_v_version_links_parent_id_idx" ON "_footer_v_version_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footer_v_version_links_locales_locale_parent_id_unique" ON "_footer_v_version_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_v_version_links_locales_parent_id_idx" ON "_footer_v_version_links_locales" USING btree ("_parent_id");
  CREATE INDEX "_footer_v_version_version__status_idx" ON "_footer_v" USING btree ("version__status");
  CREATE INDEX "_footer_v_created_at_idx" ON "_footer_v" USING btree ("created_at");
  CREATE INDEX "_footer_v_updated_at_idx" ON "_footer_v" USING btree ("updated_at");
  CREATE INDEX "_footer_v_snapshot_idx" ON "_footer_v" USING btree ("snapshot");
  CREATE INDEX "_footer_v_published_locale_idx" ON "_footer_v" USING btree ("published_locale");
  CREATE INDEX "_footer_v_latest_idx" ON "_footer_v" USING btree ("latest");
  CREATE INDEX "_footer_v_autosave_idx" ON "_footer_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_footer_v_locales_locale_parent_id_unique" ON "_footer_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_v_locales_parent_id_idx" ON "_footer_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_sections_visibility_v_version_version__status_idx" ON "_sections_visibility_v" USING btree ("version__status");
  CREATE INDEX "_sections_visibility_v_created_at_idx" ON "_sections_visibility_v" USING btree ("created_at");
  CREATE INDEX "_sections_visibility_v_updated_at_idx" ON "_sections_visibility_v" USING btree ("updated_at");
  CREATE INDEX "_sections_visibility_v_snapshot_idx" ON "_sections_visibility_v" USING btree ("snapshot");
  CREATE INDEX "_sections_visibility_v_published_locale_idx" ON "_sections_visibility_v" USING btree ("published_locale");
  CREATE INDEX "_sections_visibility_v_latest_idx" ON "_sections_visibility_v" USING btree ("latest");
  CREATE INDEX "_sections_visibility_v_autosave_idx" ON "_sections_visibility_v" USING btree ("autosave");
  CREATE INDEX "_sections_content_v_version_version__status_idx" ON "_sections_content_v" USING btree ("version__status");
  CREATE INDEX "_sections_content_v_created_at_idx" ON "_sections_content_v" USING btree ("created_at");
  CREATE INDEX "_sections_content_v_updated_at_idx" ON "_sections_content_v" USING btree ("updated_at");
  CREATE INDEX "_sections_content_v_snapshot_idx" ON "_sections_content_v" USING btree ("snapshot");
  CREATE INDEX "_sections_content_v_published_locale_idx" ON "_sections_content_v" USING btree ("published_locale");
  CREATE INDEX "_sections_content_v_latest_idx" ON "_sections_content_v" USING btree ("latest");
  CREATE INDEX "_sections_content_v_autosave_idx" ON "_sections_content_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_sections_content_v_locales_locale_parent_id_unique" ON "_sections_content_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sections_content_v_locales_parent_id_idx" ON "_sections_content_v_locales" USING btree ("_parent_id");
  CREATE INDEX "about__status_idx" ON "about" USING btree ("_status");
  CREATE INDEX "navigation__status_idx" ON "navigation" USING btree ("_status");
  CREATE INDEX "footer__status_idx" ON "footer" USING btree ("_status");
  CREATE INDEX "contact__status_idx" ON "contact" USING btree ("_status");
  CREATE INDEX "hero__status_idx" ON "hero" USING btree ("_status");
  CREATE INDEX "sections_content__status_idx" ON "sections_content" USING btree ("_status");
  CREATE INDEX "sections_visibility__status_idx" ON "sections_visibility" USING btree ("_status");
  CREATE INDEX "settings__status_idx" ON "settings" USING btree ("_status");`)

  await db.execute(sql`
   UPDATE "about" SET "_status" = 'published';
  UPDATE "navigation" SET "_status" = 'published';
  UPDATE "footer" SET "_status" = 'published';
  UPDATE "contact" SET "_status" = 'published';
  UPDATE "hero" SET "_status" = 'published';
  UPDATE "sections_content" SET "_status" = 'published';
  UPDATE "sections_visibility" SET "_status" = 'published';
  UPDATE "settings" SET "_status" = 'published';`)

  // One version per global, copied from its main row with its locales,
  // arrays and their locales, marked latest. Array rows get a new id and keep
  // the original one in `_uuid`, which is also how their locales find them.
  // Each version table is new and holds only the row inserted here, hence the
  // CROSS JOINs.
  await db.execute(sql`
   INSERT INTO "_about_v" ("version_portrait_id", "version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "portrait_id", "_status"::text::"enum__about_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "about";
  INSERT INTO "_about_v_locales" ("_locale", "_parent_id", "version_eyebrow", "version_title", "version_description", "version_body") SELECT l."_locale", v."id", l."eyebrow", l."title", l."description", l."body" FROM "about_locales" l CROSS JOIN "_about_v" v;
  INSERT INTO "_about_v_version_point_groups" ("_order", "_parent_id", "_uuid", "_locale", "title", "content") SELECT a."_order", v."id", a."id", a."_locale", a."title", a."content" FROM "about_point_groups" a CROSS JOIN "_about_v" v;
  INSERT INTO "_contact_v" ("version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "_status"::text::"enum__contact_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "contact";
  INSERT INTO "_contact_v_locales" ("_locale", "_parent_id", "version_eyebrow", "version_title", "version_description", "version_success_message") SELECT l."_locale", v."id", l."eyebrow", l."title", l."description", l."success_message" FROM "contact_locales" l CROSS JOIN "_contact_v" v;
  INSERT INTO "_footer_v" ("version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "_status"::text::"enum__footer_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "footer";
  INSERT INTO "_footer_v_locales" ("_locale", "_parent_id", "version_text") SELECT l."_locale", v."id", l."text" FROM "footer_locales" l CROSS JOIN "_footer_v" v;
  INSERT INTO "_footer_v_version_links" ("_order", "_parent_id", "_uuid", "href") SELECT a."_order", v."id", a."id", a."href" FROM "footer_links" a CROSS JOIN "_footer_v" v;
  INSERT INTO "_footer_v_version_links_locales" ("_locale", "_parent_id", "label") SELECT l."_locale", va."id", l."label" FROM "footer_links_locales" l JOIN "_footer_v_version_links" va ON va."_uuid" = l."_parent_id";
  INSERT INTO "_settings_v" ("version_name", "version_photo_id", "version_logo_id", "version_theme_primary_color", "version_theme_accent_color", "version_theme_default_theme", "version_theme_cursor_effect", "version_theme_background_style", "version_contact_email", "version_seo_default_title", "version_seo_default_image_id", "version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "name", "photo_id", "logo_id", "theme_primary_color"::text::"enum__settings_v_version_theme_primary_color", "theme_accent_color"::text::"enum__settings_v_version_theme_accent_color", "theme_default_theme"::text::"enum__settings_v_version_theme_default_theme", "theme_cursor_effect"::text::"enum__settings_v_version_theme_cursor_effect", "theme_background_style"::text::"enum__settings_v_version_theme_background_style", "contact_email", "seo_default_title", "seo_default_image_id", "_status"::text::"enum__settings_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "settings";
  INSERT INTO "_settings_v_locales" ("_locale", "_parent_id", "version_profession", "version_seo_default_description") SELECT l."_locale", v."id", l."profession", l."seo_default_description" FROM "settings_locales" l CROSS JOIN "_settings_v" v;
  INSERT INTO "_settings_v_version_social_links" ("_order", "_parent_id", "_uuid", "platform", "url", "icon_id") SELECT a."_order", v."id", a."id", a."platform"::text::"enum__settings_v_version_social_links_platform", a."url", a."icon_id" FROM "settings_social_links" a CROSS JOIN "_settings_v" v;
  INSERT INTO "_settings_v_version_theme_background_photos" ("_order", "_parent_id", "_uuid", "photo_id") SELECT a."_order", v."id", a."id", a."photo_id" FROM "settings_theme_background_photos" a CROSS JOIN "_settings_v" v;
  INSERT INTO "_hero_v" ("version_availability_enabled", "version_primary_cta_href", "version_secondary_cta_href", "version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "availability_enabled", "primary_cta_href", "secondary_cta_href", "_status"::text::"enum__hero_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "hero";
  INSERT INTO "_hero_v_locales" ("_locale", "_parent_id", "version_availability_label", "version_eyebrow", "version_title", "version_description", "version_primary_cta_label", "version_secondary_cta_label", "version_resume_cta_label", "version_resume_cta_file_id", "version_meta_title", "version_meta_description", "version_meta_image_id") SELECT l."_locale", v."id", l."availability_label", l."eyebrow", l."title", l."description", l."primary_cta_label", l."secondary_cta_label", l."resume_cta_label", l."resume_cta_file_id", l."meta_title", l."meta_description", l."meta_image_id" FROM "hero_locales" l CROSS JOIN "_hero_v" v;
  INSERT INTO "_hero_v_version_highlights" ("_order", "_parent_id", "_uuid", "_locale", "value") SELECT a."_order", v."id", a."id", a."_locale", a."value" FROM "hero_highlights" a CROSS JOIN "_hero_v" v;
  INSERT INTO "_navigation_v" ("version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "_status"::text::"enum__navigation_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "navigation";
  INSERT INTO "_navigation_v_version_items" ("_order", "_parent_id", "_uuid", "href") SELECT a."_order", v."id", a."id", a."href" FROM "navigation_items" a CROSS JOIN "_navigation_v" v;
  INSERT INTO "_navigation_v_version_items_locales" ("_locale", "_parent_id", "label") SELECT l."_locale", va."id", l."label" FROM "navigation_items_locales" l JOIN "_navigation_v_version_items" va ON va."_uuid" = l."_parent_id";
  INSERT INTO "_sections_content_v" ("version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "_status"::text::"enum__sections_content_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "sections_content";
  INSERT INTO "_sections_content_v_locales" ("_locale", "_parent_id", "version_projects_eyebrow", "version_projects_title", "version_projects_description", "version_experience_eyebrow", "version_experience_title", "version_experience_description", "version_education_eyebrow", "version_education_title", "version_education_description", "version_skills_eyebrow", "version_skills_title", "version_skills_description", "version_testimonials_eyebrow", "version_testimonials_title", "version_testimonials_description", "version_journal_eyebrow", "version_journal_title", "version_journal_description") SELECT l."_locale", v."id", l."projects_eyebrow", l."projects_title", l."projects_description", l."experience_eyebrow", l."experience_title", l."experience_description", l."education_eyebrow", l."education_title", l."education_description", l."skills_eyebrow", l."skills_title", l."skills_description", l."testimonials_eyebrow", l."testimonials_title", l."testimonials_description", l."journal_eyebrow", l."journal_title", l."journal_description" FROM "sections_content_locales" l CROSS JOIN "_sections_content_v" v;
  INSERT INTO "_sections_visibility_v" ("version_hero", "version_about", "version_projects", "version_experience", "version_education", "version_skills", "version_testimonials", "version_contact", "version_journal", "version__status", "version_updated_at", "version_created_at", "created_at", "updated_at", "latest", "autosave") SELECT "hero", "about", "projects", "experience", "education", "skills", "testimonials", "contact", "journal", "_status"::text::"enum__sections_visibility_v_version_status", "updated_at", "created_at", "updated_at", "updated_at", true, false FROM "sections_visibility";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // SET NOT NULL fails if a draft left a required field empty: fill it, or
  // publish over it, before migrating down.
  await db.execute(sql`
   DROP TABLE "_sections_content_v_locales" CASCADE;
  DROP TABLE "_sections_content_v" CASCADE;
  DROP TABLE "_sections_visibility_v" CASCADE;
  DROP TABLE "_footer_v_locales" CASCADE;
  DROP TABLE "_footer_v" CASCADE;
  DROP TABLE "_footer_v_version_links_locales" CASCADE;
  DROP TABLE "_footer_v_version_links" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TABLE "_navigation_v_version_items_locales" CASCADE;
  DROP TABLE "_navigation_v_version_items" CASCADE;
  DROP TABLE "_contact_v_locales" CASCADE;
  DROP TABLE "_contact_v" CASCADE;
  DROP TABLE "_about_v_locales" CASCADE;
  DROP TABLE "_about_v" CASCADE;
  DROP TABLE "_about_v_version_point_groups" CASCADE;
  DROP TABLE "_hero_v_locales" CASCADE;
  DROP TABLE "_hero_v" CASCADE;
  DROP TABLE "_hero_v_version_highlights" CASCADE;
  DROP TABLE "_settings_v_locales" CASCADE;
  DROP TABLE "_settings_v" CASCADE;
  DROP TABLE "_settings_v_version_social_links" CASCADE;
  DROP TABLE "_settings_v_version_theme_background_photos" CASCADE;
  DROP INDEX "about__status_idx";
  DROP INDEX "navigation__status_idx";
  DROP INDEX "footer__status_idx";
  DROP INDEX "contact__status_idx";
  DROP INDEX "hero__status_idx";
  DROP INDEX "sections_content__status_idx";
  DROP INDEX "sections_visibility__status_idx";
  DROP INDEX "settings__status_idx";
  ALTER TABLE "about" DROP COLUMN "_status";
  ALTER TABLE "navigation" DROP COLUMN "_status";
  ALTER TABLE "footer" DROP COLUMN "_status";
  ALTER TABLE "contact" DROP COLUMN "_status";
  ALTER TABLE "hero" DROP COLUMN "_status";
  ALTER TABLE "sections_content" DROP COLUMN "_status";
  ALTER TABLE "sections_visibility" DROP COLUMN "_status";
  ALTER TABLE "settings" DROP COLUMN "_status";
  ALTER TABLE "hero_highlights" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "navigation_items" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "navigation_items_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "footer_links" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "footer_links_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "about_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "contact_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "settings_social_links" ALTER COLUMN "platform" SET NOT NULL;
  ALTER TABLE "settings_social_links" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "hero_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "theme_primary_color" SET NOT NULL;
  ALTER TABLE "about_point_groups" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "projects_title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "experience_title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "education_title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "skills_title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "testimonials_title" SET NOT NULL;
  ALTER TABLE "sections_content_locales" ALTER COLUMN "journal_title" SET NOT NULL;
  DROP TYPE "public"."enum_settings_status";
  DROP TYPE "public"."enum__settings_v_version_social_links_platform";
  DROP TYPE "public"."enum__settings_v_version_theme_primary_color";
  DROP TYPE "public"."enum__settings_v_version_theme_accent_color";
  DROP TYPE "public"."enum__settings_v_version_theme_default_theme";
  DROP TYPE "public"."enum__settings_v_version_theme_cursor_effect";
  DROP TYPE "public"."enum__settings_v_version_theme_background_style";
  DROP TYPE "public"."enum__settings_v_version_status";
  DROP TYPE "public"."enum__settings_v_published_locale";
  DROP TYPE "public"."enum_hero_status";
  DROP TYPE "public"."enum__hero_v_version_status";
  DROP TYPE "public"."enum__hero_v_published_locale";
  DROP TYPE "public"."enum_about_status";
  DROP TYPE "public"."enum__about_v_version_status";
  DROP TYPE "public"."enum__about_v_published_locale";
  DROP TYPE "public"."enum_contact_status";
  DROP TYPE "public"."enum__contact_v_version_status";
  DROP TYPE "public"."enum__contact_v_published_locale";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_status";
  DROP TYPE "public"."enum__navigation_v_published_locale";
  DROP TYPE "public"."enum_footer_status";
  DROP TYPE "public"."enum__footer_v_version_status";
  DROP TYPE "public"."enum__footer_v_published_locale";
  DROP TYPE "public"."enum_sections_visibility_status";
  DROP TYPE "public"."enum__sections_visibility_v_version_status";
  DROP TYPE "public"."enum__sections_visibility_v_published_locale";
  DROP TYPE "public"."enum_sections_content_status";
  DROP TYPE "public"."enum__sections_content_v_version_status";
  DROP TYPE "public"."enum__sections_content_v_published_locale";`)
}
