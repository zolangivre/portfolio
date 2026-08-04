import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Versioning, drafts and preview for the editorial content.
//
// Projects and Journal swap the hand-rolled `visibility` select for Payload's
// native draft/publish workflow, and the eight globals gain version history
// too. That means a `_v` table per versioned entity, plus the jobs queue behind
// scheduled publishing and the redirects collection.
//
// Two things worth knowing when reading the SQL below:
//
//   * Enabling drafts makes required fields nullable — a draft is allowed to be
//     incomplete, so Payload drops NOT NULL from every required column.
//   * Payload snake-cases the injected `_status` field down to `status`, which
//     on `projects` collides with the existing editorial status field. The old
//     enum is renamed out of the way first, then the freed name is reused.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
-- 1. The drafts field _status snake-cases to 'status', which would collide
--    with the existing editorial status field on projects. Move that one to
--    its own type; the projects.status column follows the rename automatically.
ALTER TYPE "enum_projects_status" RENAME TO "enum_projects_project_status";

--    The freed-up name is then reused for the drafts status itself. It lives
--    in both dumps under the same name, so the schema diff cannot see it as
--    new and it has to be spelled out here.
CREATE TYPE "enum_projects_status" AS ENUM (
    'draft',
    'published'
);

-- 2. New enum types (draft status, version tables, jobs, redirects).
CREATE TYPE "enum__about_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__about_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__contact_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__contact_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__footer_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__footer_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__hero_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__hero_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__journal_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__journal_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__navigation_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__navigation_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__projects_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__projects_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__sections_content_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__sections_content_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__sections_visibility_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__sections_visibility_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__settings_v_published_locale" AS ENUM (
    'fr',
    'en'
);
CREATE TYPE "enum__settings_v_version_social_links_platform" AS ENUM (
    'github',
    'linkedin',
    'x',
    'instagram',
    'dribbble',
    'other'
);
CREATE TYPE "enum__settings_v_version_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum__settings_v_version_theme_accent_color" AS ENUM (
    'orange',
    'coral',
    'red',
    'crimson',
    'rose',
    'pink',
    'purple',
    'violet',
    'indigo',
    'blue',
    'sky',
    'cyan',
    'teal',
    'mint',
    'emerald',
    'green',
    'lime',
    'olive',
    'gold',
    'amber',
    'yellow',
    'slate',
    'gray',
    'neutral'
);
CREATE TYPE "enum__settings_v_version_theme_cursor_effect" AS ENUM (
    'ring',
    'trail'
);
CREATE TYPE "enum__settings_v_version_theme_default_theme" AS ENUM (
    'light',
    'dark',
    'system'
);
CREATE TYPE "enum__settings_v_version_theme_primary_color" AS ENUM (
    'orange',
    'coral',
    'red',
    'crimson',
    'rose',
    'pink',
    'purple',
    'violet',
    'indigo',
    'blue',
    'sky',
    'cyan',
    'teal',
    'mint',
    'emerald',
    'green',
    'lime',
    'olive',
    'gold',
    'amber',
    'yellow',
    'slate',
    'gray',
    'neutral'
);
CREATE TYPE "enum_about_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_contact_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_footer_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_hero_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_journal_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_navigation_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_payload_jobs_log_state" AS ENUM (
    'failed',
    'succeeded'
);
CREATE TYPE "enum_payload_jobs_log_task_slug" AS ENUM (
    'inline',
    'schedulePublish'
);
CREATE TYPE "enum_payload_jobs_task_slug" AS ENUM (
    'inline',
    'schedulePublish'
);
CREATE TYPE "enum_redirects_to_type" AS ENUM (
    'reference',
    'custom'
);
CREATE TYPE "enum_redirects_type" AS ENUM (
    '301',
    '302'
);
CREATE TYPE "enum_sections_content_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_sections_visibility_status" AS ENUM (
    'draft',
    'published'
);
CREATE TYPE "enum_settings_status" AS ENUM (
    'draft',
    'published'
);

-- 3. New tables: version history (_v), the jobs queue, and redirects.
CREATE TABLE "_about_v" (
    id integer NOT NULL,
    version_portrait_id integer,
    version__status enum__about_v_version_status DEFAULT 'draft'::enum__about_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__about_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_about_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_about_v_id_seq" OWNED BY "_about_v"."id";
ALTER TABLE ONLY "_about_v" ALTER COLUMN "id" SET DEFAULT nextval('"_about_v_id_seq"'::regclass);
CREATE TABLE "_about_v_locales" (
    version_eyebrow character varying DEFAULT 'About'::character varying,
    version_title character varying DEFAULT 'Designing thoughtful products with engineering depth.'::character varying,
    version_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "A product-minded engineer focused on building fast, reliable experiences from concept to launch.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_body jsonb,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_about_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_about_v_locales_id_seq" OWNED BY "_about_v_locales"."id";
ALTER TABLE ONLY "_about_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_about_v_locales_id_seq"'::regclass);
CREATE TABLE "_about_v_version_point_groups" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _locale _locales NOT NULL,
    id integer NOT NULL,
    title character varying,
    content jsonb,
    _uuid character varying
);
CREATE SEQUENCE "_about_v_version_point_groups_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_about_v_version_point_groups_id_seq" OWNED BY "_about_v_version_point_groups"."id";
ALTER TABLE ONLY "_about_v_version_point_groups" ALTER COLUMN "id" SET DEFAULT nextval('"_about_v_version_point_groups_id_seq"'::regclass);
CREATE TABLE "_contact_v" (
    id integer NOT NULL,
    version__status enum__contact_v_version_status DEFAULT 'draft'::enum__contact_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__contact_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_contact_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_contact_v_id_seq" OWNED BY "_contact_v"."id";
ALTER TABLE ONLY "_contact_v" ALTER COLUMN "id" SET DEFAULT nextval('"_contact_v_id_seq"'::regclass);
CREATE TABLE "_contact_v_locales" (
    version_eyebrow character varying DEFAULT 'Contact'::character varying,
    version_title character varying DEFAULT 'Let’s build something meaningful.'::character varying,
    version_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Available for select freelance work, product collaborations, and full-stack product builds.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_success_message character varying DEFAULT 'Thanks for reaching out — I’ll get back to you shortly.'::character varying,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_contact_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_contact_v_locales_id_seq" OWNED BY "_contact_v_locales"."id";
ALTER TABLE ONLY "_contact_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_contact_v_locales_id_seq"'::regclass);
CREATE TABLE "_footer_v" (
    id integer NOT NULL,
    version__status enum__footer_v_version_status DEFAULT 'draft'::enum__footer_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__footer_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_footer_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_footer_v_id_seq" OWNED BY "_footer_v"."id";
ALTER TABLE ONLY "_footer_v" ALTER COLUMN "id" SET DEFAULT nextval('"_footer_v_id_seq"'::regclass);
CREATE TABLE "_footer_v_locales" (
    version_text character varying DEFAULT 'Crafted for ambitious products, polished interfaces, and reliable engineering.'::character varying,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_footer_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_footer_v_locales_id_seq" OWNED BY "_footer_v_locales"."id";
ALTER TABLE ONLY "_footer_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_footer_v_locales_id_seq"'::regclass);
CREATE TABLE "_footer_v_version_links" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    href character varying,
    _uuid character varying
);
CREATE SEQUENCE "_footer_v_version_links_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_footer_v_version_links_id_seq" OWNED BY "_footer_v_version_links"."id";
ALTER TABLE ONLY "_footer_v_version_links" ALTER COLUMN "id" SET DEFAULT nextval('"_footer_v_version_links_id_seq"'::regclass);
CREATE TABLE "_footer_v_version_links_locales" (
    label character varying,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_footer_v_version_links_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_footer_v_version_links_locales_id_seq" OWNED BY "_footer_v_version_links_locales"."id";
ALTER TABLE ONLY "_footer_v_version_links_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_footer_v_version_links_locales_id_seq"'::regclass);
CREATE TABLE "_hero_v" (
    id integer NOT NULL,
    version_primary_cta_href character varying DEFAULT '#projects'::character varying,
    version_secondary_cta_href character varying DEFAULT '#contact'::character varying,
    version__status enum__hero_v_version_status DEFAULT 'draft'::enum__hero_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__hero_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_hero_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_hero_v_id_seq" OWNED BY "_hero_v"."id";
ALTER TABLE ONLY "_hero_v" ALTER COLUMN "id" SET DEFAULT nextval('"_hero_v_id_seq"'::regclass);
CREATE TABLE "_hero_v_locales" (
    version_eyebrow character varying DEFAULT 'Full-stack developer'::character varying,
    version_title character varying DEFAULT 'Building polished digital products with calm, modern engineering.'::character varying,
    version_description jsonb,
    version_primary_cta_label character varying DEFAULT 'View projects'::character varying,
    version_secondary_cta_label character varying DEFAULT 'Let’s talk'::character varying,
    version_resume_cta_label character varying DEFAULT 'Download CV'::character varying,
    version_resume_cta_file_id integer,
    version_meta_title character varying,
    version_meta_description character varying,
    version_meta_image_id integer,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_hero_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_hero_v_locales_id_seq" OWNED BY "_hero_v_locales"."id";
ALTER TABLE ONLY "_hero_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_hero_v_locales_id_seq"'::regclass);
CREATE TABLE "_hero_v_version_highlights" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    _locale _locales NOT NULL,
    id integer NOT NULL,
    value character varying,
    _uuid character varying
);
CREATE SEQUENCE "_hero_v_version_highlights_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_hero_v_version_highlights_id_seq" OWNED BY "_hero_v_version_highlights"."id";
ALTER TABLE ONLY "_hero_v_version_highlights" ALTER COLUMN "id" SET DEFAULT nextval('"_hero_v_version_highlights_id_seq"'::regclass);
CREATE TABLE "_journal_v" (
    id integer NOT NULL,
    parent_id integer,
    version_slug character varying,
    version_category_id integer,
    version_cover_image_id integer,
    version_date timestamp(3) with time zone,
    version_featured boolean DEFAULT false,
    version_order numeric,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status enum__journal_v_version_status DEFAULT 'draft'::enum__journal_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__journal_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_journal_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_journal_v_id_seq" OWNED BY "_journal_v"."id";
ALTER TABLE ONLY "_journal_v" ALTER COLUMN "id" SET DEFAULT nextval('"_journal_v_id_seq"'::regclass);
CREATE TABLE "_journal_v_locales" (
    version_title character varying,
    version_short_description character varying,
    version_content jsonb,
    version_location character varying,
    version_meta_title character varying,
    version_meta_description character varying,
    version_meta_image_id integer,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_journal_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_journal_v_locales_id_seq" OWNED BY "_journal_v_locales"."id";
ALTER TABLE ONLY "_journal_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_journal_v_locales_id_seq"'::regclass);
CREATE TABLE "_journal_v_rels" (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer
);
CREATE SEQUENCE "_journal_v_rels_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_journal_v_rels_id_seq" OWNED BY "_journal_v_rels"."id";
ALTER TABLE ONLY "_journal_v_rels" ALTER COLUMN "id" SET DEFAULT nextval('"_journal_v_rels_id_seq"'::regclass);
CREATE TABLE "_journal_v_version_tags" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    value character varying,
    _uuid character varying
);
CREATE SEQUENCE "_journal_v_version_tags_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_journal_v_version_tags_id_seq" OWNED BY "_journal_v_version_tags"."id";
ALTER TABLE ONLY "_journal_v_version_tags" ALTER COLUMN "id" SET DEFAULT nextval('"_journal_v_version_tags_id_seq"'::regclass);
CREATE TABLE "_navigation_v" (
    id integer NOT NULL,
    version__status enum__navigation_v_version_status DEFAULT 'draft'::enum__navigation_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__navigation_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_navigation_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_navigation_v_id_seq" OWNED BY "_navigation_v"."id";
ALTER TABLE ONLY "_navigation_v" ALTER COLUMN "id" SET DEFAULT nextval('"_navigation_v_id_seq"'::regclass);
CREATE TABLE "_navigation_v_version_items" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    href character varying,
    _uuid character varying
);
CREATE SEQUENCE "_navigation_v_version_items_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_navigation_v_version_items_id_seq" OWNED BY "_navigation_v_version_items"."id";
ALTER TABLE ONLY "_navigation_v_version_items" ALTER COLUMN "id" SET DEFAULT nextval('"_navigation_v_version_items_id_seq"'::regclass);
CREATE TABLE "_navigation_v_version_items_locales" (
    label character varying,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_navigation_v_version_items_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_navigation_v_version_items_locales_id_seq" OWNED BY "_navigation_v_version_items_locales"."id";
ALTER TABLE ONLY "_navigation_v_version_items_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_navigation_v_version_items_locales_id_seq"'::regclass);
CREATE TABLE "_projects_v" (
    id integer NOT NULL,
    parent_id integer,
    version_slug character varying,
    version_cover_image_id integer,
    version_cover_image_dark_id integer,
    version_github_url character varying,
    version_live_url character varying,
    version_featured boolean DEFAULT false,
    version_order numeric,
    version_year numeric,
    version_status enum_projects_project_status DEFAULT 'live'::enum_projects_project_status,
    version_category_id integer,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status enum__projects_v_version_status DEFAULT 'draft'::enum__projects_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__projects_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_projects_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_projects_v_id_seq" OWNED BY "_projects_v"."id";
ALTER TABLE ONLY "_projects_v" ALTER COLUMN "id" SET DEFAULT nextval('"_projects_v_id_seq"'::regclass);
CREATE TABLE "_projects_v_locales" (
    version_title character varying,
    version_short_description character varying,
    version_description jsonb,
    version_meta_title character varying,
    version_meta_description character varying,
    version_meta_image_id integer,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_projects_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_projects_v_locales_id_seq" OWNED BY "_projects_v_locales"."id";
ALTER TABLE ONLY "_projects_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_projects_v_locales_id_seq"'::regclass);
CREATE TABLE "_projects_v_rels" (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer,
    technologies_id integer
);
CREATE SEQUENCE "_projects_v_rels_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_projects_v_rels_id_seq" OWNED BY "_projects_v_rels"."id";
ALTER TABLE ONLY "_projects_v_rels" ALTER COLUMN "id" SET DEFAULT nextval('"_projects_v_rels_id_seq"'::regclass);
CREATE TABLE "_sections_content_v" (
    id integer NOT NULL,
    version__status enum__sections_content_v_version_status DEFAULT 'draft'::enum__sections_content_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__sections_content_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_sections_content_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_sections_content_v_id_seq" OWNED BY "_sections_content_v"."id";
ALTER TABLE ONLY "_sections_content_v" ALTER COLUMN "id" SET DEFAULT nextval('"_sections_content_v_id_seq"'::regclass);
CREATE TABLE "_sections_content_v_locales" (
    version_projects_eyebrow character varying DEFAULT 'Selected work'::character varying,
    version_projects_title character varying DEFAULT 'Projects'::character varying,
    version_projects_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Selected work shaped for fast-moving products, thoughtful UX, and reliable engineering.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_experience_eyebrow character varying DEFAULT 'Background'::character varying,
    version_experience_title character varying DEFAULT 'Experience'::character varying,
    version_experience_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "A track record of building product experiences with strong technical ownership.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_education_eyebrow character varying DEFAULT 'Education'::character varying,
    version_education_title character varying DEFAULT 'Education'::character varying,
    version_education_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Academic background and continuing learning paths managed from Payload CMS.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_skills_eyebrow character varying DEFAULT 'Capabilities'::character varying,
    version_skills_title character varying DEFAULT 'Skills'::character varying,
    version_skills_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "A toolkit refined for modern product development across frontend, backend, and delivery.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_testimonials_eyebrow character varying DEFAULT 'Testimonials'::character varying,
    version_testimonials_title character varying DEFAULT 'What people say'::character varying,
    version_testimonials_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Feedback from people I''ve worked with on shipped products.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    version_journal_eyebrow character varying DEFAULT 'Beyond code'::character varying,
    version_journal_title character varying DEFAULT 'Journal'::character varying,
    version_journal_description jsonb DEFAULT '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Travel, sport, achievements, and milestones — another side of the journey.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr", "textStyle": "", "textFormat": 0}], "direction": "ltr"}}'::jsonb,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_sections_content_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_sections_content_v_locales_id_seq" OWNED BY "_sections_content_v_locales"."id";
ALTER TABLE ONLY "_sections_content_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_sections_content_v_locales_id_seq"'::regclass);
CREATE TABLE "_sections_visibility_v" (
    id integer NOT NULL,
    version_hero boolean DEFAULT true,
    version_about boolean DEFAULT true,
    version_projects boolean DEFAULT true,
    version_experience boolean DEFAULT true,
    version_education boolean DEFAULT true,
    version_skills boolean DEFAULT true,
    version_testimonials boolean DEFAULT true,
    version_contact boolean DEFAULT true,
    version_journal boolean DEFAULT true,
    version__status enum__sections_visibility_v_version_status DEFAULT 'draft'::enum__sections_visibility_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__sections_visibility_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_sections_visibility_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_sections_visibility_v_id_seq" OWNED BY "_sections_visibility_v"."id";
ALTER TABLE ONLY "_sections_visibility_v" ALTER COLUMN "id" SET DEFAULT nextval('"_sections_visibility_v_id_seq"'::regclass);
CREATE TABLE "_settings_v" (
    id integer NOT NULL,
    version_name character varying DEFAULT 'Alex Porter'::character varying,
    version_photo_id integer,
    version_logo_id integer,
    version_theme_primary_color enum__settings_v_version_theme_primary_color DEFAULT 'orange'::enum__settings_v_version_theme_primary_color,
    version_theme_accent_color enum__settings_v_version_theme_accent_color,
    version_theme_default_theme enum__settings_v_version_theme_default_theme DEFAULT 'system'::enum__settings_v_version_theme_default_theme,
    version_theme_cursor_effect enum__settings_v_version_theme_cursor_effect DEFAULT 'ring'::enum__settings_v_version_theme_cursor_effect,
    version_contact_email character varying DEFAULT 'hello@yourdomain.com'::character varying,
    version_seo_default_title character varying DEFAULT 'Developer Portfolio'::character varying,
    version_seo_default_image_id integer,
    version__status enum__settings_v_version_status DEFAULT 'draft'::enum__settings_v_version_status,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale enum__settings_v_published_locale,
    latest boolean,
    autosave boolean
);
CREATE SEQUENCE "_settings_v_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_settings_v_id_seq" OWNED BY "_settings_v"."id";
ALTER TABLE ONLY "_settings_v" ALTER COLUMN "id" SET DEFAULT nextval('"_settings_v_id_seq"'::regclass);
CREATE TABLE "_settings_v_locales" (
    version_profession character varying DEFAULT 'Full-stack developer'::character varying,
    version_seo_default_description character varying DEFAULT 'Professional developer portfolio powered by Payload CMS and Next.js.'::character varying,
    id integer NOT NULL,
    _locale _locales NOT NULL,
    _parent_id integer NOT NULL
);
CREATE SEQUENCE "_settings_v_locales_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_settings_v_locales_id_seq" OWNED BY "_settings_v_locales"."id";
ALTER TABLE ONLY "_settings_v_locales" ALTER COLUMN "id" SET DEFAULT nextval('"_settings_v_locales_id_seq"'::regclass);
CREATE TABLE "_settings_v_version_social_links" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    platform enum__settings_v_version_social_links_platform,
    url character varying,
    icon_id integer,
    _uuid character varying
);
CREATE SEQUENCE "_settings_v_version_social_links_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "_settings_v_version_social_links_id_seq" OWNED BY "_settings_v_version_social_links"."id";
ALTER TABLE ONLY "_settings_v_version_social_links" ALTER COLUMN "id" SET DEFAULT nextval('"_settings_v_version_social_links_id_seq"'::regclass);
CREATE TABLE "payload_jobs" (
    id integer NOT NULL,
    input jsonb,
    completed_at timestamp(3) with time zone,
    total_tried numeric DEFAULT 0,
    has_error boolean DEFAULT false,
    error jsonb,
    task_slug enum_payload_jobs_task_slug,
    queue character varying DEFAULT 'default'::character varying,
    wait_until timestamp(3) with time zone,
    processing boolean DEFAULT false,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE "payload_jobs_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "payload_jobs_id_seq" OWNED BY "payload_jobs"."id";
ALTER TABLE ONLY "payload_jobs" ALTER COLUMN "id" SET DEFAULT nextval('"payload_jobs_id_seq"'::regclass);
CREATE TABLE "payload_jobs_log" (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    executed_at timestamp(3) with time zone NOT NULL,
    completed_at timestamp(3) with time zone NOT NULL,
    task_slug enum_payload_jobs_log_task_slug NOT NULL,
    task_i_d character varying NOT NULL,
    input jsonb,
    output jsonb,
    state enum_payload_jobs_log_state NOT NULL,
    error jsonb
);
CREATE TABLE "redirects" (
    id integer NOT NULL,
    "from" character varying NOT NULL,
    to_type enum_redirects_to_type DEFAULT 'reference'::enum_redirects_to_type,
    to_url character varying,
    type enum_redirects_type NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE "redirects_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "redirects_id_seq" OWNED BY "redirects"."id";
ALTER TABLE ONLY "redirects" ALTER COLUMN "id" SET DEFAULT nextval('"redirects_id_seq"'::regclass);
CREATE TABLE "redirects_rels" (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    projects_id integer,
    journal_id integer
);
CREATE SEQUENCE "redirects_rels_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE "redirects_rels_id_seq" OWNED BY "redirects_rels"."id";
ALTER TABLE ONLY "redirects_rels" ALTER COLUMN "id" SET DEFAULT nextval('"redirects_rels_id_seq"'::regclass);

-- 4. Primary keys and unique constraints.
ALTER TABLE ONLY "_about_v_locales" ADD CONSTRAINT "_about_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_about_v" ADD CONSTRAINT "_about_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_about_v_version_point_groups" ADD CONSTRAINT "_about_v_version_point_groups_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_contact_v_locales" ADD CONSTRAINT "_contact_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_contact_v" ADD CONSTRAINT "_contact_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_footer_v_locales" ADD CONSTRAINT "_footer_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_footer_v" ADD CONSTRAINT "_footer_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_footer_v_version_links_locales" ADD CONSTRAINT "_footer_v_version_links_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_footer_v_version_links" ADD CONSTRAINT "_footer_v_version_links_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_hero_v" ADD CONSTRAINT "_hero_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_hero_v_version_highlights" ADD CONSTRAINT "_hero_v_version_highlights_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_journal_v_locales" ADD CONSTRAINT "_journal_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_journal_v" ADD CONSTRAINT "_journal_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_journal_v_rels" ADD CONSTRAINT "_journal_v_rels_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_journal_v_version_tags" ADD CONSTRAINT "_journal_v_version_tags_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_navigation_v" ADD CONSTRAINT "_navigation_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_navigation_v_version_items_locales" ADD CONSTRAINT "_navigation_v_version_items_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_projects_v" ADD CONSTRAINT "_projects_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_sections_content_v_locales" ADD CONSTRAINT "_sections_content_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_sections_content_v" ADD CONSTRAINT "_sections_content_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_sections_visibility_v" ADD CONSTRAINT "_sections_visibility_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_settings_v_locales" ADD CONSTRAINT "_settings_v_locales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_settings_v" ADD CONSTRAINT "_settings_v_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "_settings_v_version_social_links" ADD CONSTRAINT "_settings_v_version_social_links_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "payload_jobs" ADD CONSTRAINT "payload_jobs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "redirects" ADD CONSTRAINT "redirects_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "redirects_rels" ADD CONSTRAINT "redirects_rels_pkey" PRIMARY KEY (id);

-- 5. Add the new columns (drafts status, redirects relation).
ALTER TABLE "about" ADD COLUMN _status enum_about_status DEFAULT 'draft'::enum_about_status;
ALTER TABLE "contact" ADD COLUMN _status enum_contact_status DEFAULT 'draft'::enum_contact_status;
ALTER TABLE "footer" ADD COLUMN _status enum_footer_status DEFAULT 'draft'::enum_footer_status;
ALTER TABLE "hero" ADD COLUMN _status enum_hero_status DEFAULT 'draft'::enum_hero_status;
ALTER TABLE "journal" ADD COLUMN _status enum_journal_status DEFAULT 'draft'::enum_journal_status;
ALTER TABLE "navigation" ADD COLUMN _status enum_navigation_status DEFAULT 'draft'::enum_navigation_status;
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN redirects_id integer;
ALTER TABLE "projects" ADD COLUMN _status enum_projects_status DEFAULT 'draft'::enum_projects_status;
ALTER TABLE "sections_content" ADD COLUMN _status enum_sections_content_status DEFAULT 'draft'::enum_sections_content_status;
ALTER TABLE "sections_visibility" ADD COLUMN _status enum_sections_visibility_status DEFAULT 'draft'::enum_sections_visibility_status;
ALTER TABLE "settings" ADD COLUMN _status enum_settings_status DEFAULT 'draft'::enum_settings_status;

-- 6. Carry the old visibility values over BEFORE the column disappears:
--    a private doc becomes an unpublished draft, a public one is published.
UPDATE "projects" SET "_status" = CASE WHEN "visibility" = 'private' THEN 'draft'::"enum_projects_status" ELSE 'published'::"enum_projects_status" END;
UPDATE "journal" SET "_status" = CASE WHEN "visibility" = 'private' THEN 'draft'::"enum_journal_status" ELSE 'published'::"enum_journal_status" END;

--    Existing global content is live today, so mark it published rather than
--    letting it fall back to the draft column default.
UPDATE "about" SET "_status" = 'published'::"enum_about_status";
UPDATE "contact" SET "_status" = 'published'::"enum_contact_status";
UPDATE "footer" SET "_status" = 'published'::"enum_footer_status";
UPDATE "hero" SET "_status" = 'published'::"enum_hero_status";
UPDATE "navigation" SET "_status" = 'published'::"enum_navigation_status";
UPDATE "sections_content" SET "_status" = 'published'::"enum_sections_content_status";
UPDATE "sections_visibility" SET "_status" = 'published'::"enum_sections_visibility_status";
UPDATE "settings" SET "_status" = 'published'::"enum_settings_status";

-- 7. Drop the replaced columns.
ALTER TABLE "journal" DROP COLUMN "visibility";
ALTER TABLE "projects" DROP COLUMN "visibility";

-- 8. Drafts can be saved incomplete, so required fields become nullable.
ALTER TABLE "about_locales" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "about_point_groups" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "contact_locales" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "footer_links" ALTER COLUMN "href" DROP NOT NULL;
ALTER TABLE "footer_links_locales" ALTER COLUMN "label" DROP NOT NULL;
ALTER TABLE "hero_highlights" ALTER COLUMN "value" DROP NOT NULL;
ALTER TABLE "hero_locales" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "slug" DROP NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "category_id" DROP NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "date" DROP NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "short_description" DROP NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "content" DROP NOT NULL;
ALTER TABLE "journal_tags" ALTER COLUMN "value" DROP NOT NULL;
ALTER TABLE "navigation_items" ALTER COLUMN "href" DROP NOT NULL;
ALTER TABLE "navigation_items_locales" ALTER COLUMN "label" DROP NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "slug" DROP NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "short_description" DROP NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "projects_title" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "experience_title" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "education_title" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "skills_title" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "testimonials_title" DROP NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "journal_title" DROP NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "theme_primary_color" DROP NOT NULL;
ALTER TABLE "settings_social_links" ALTER COLUMN "platform" DROP NOT NULL;
ALTER TABLE "settings_social_links" ALTER COLUMN "url" DROP NOT NULL;

-- 9. Foreign keys.
ALTER TABLE ONLY "_about_v_locales" ADD CONSTRAINT "_about_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _about_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_about_v_version_point_groups" ADD CONSTRAINT "_about_v_version_point_groups_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _about_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_about_v" ADD CONSTRAINT "_about_v_version_portrait_id_media_id_fk" FOREIGN KEY (version_portrait_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_contact_v_locales" ADD CONSTRAINT "_contact_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _contact_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_footer_v_locales" ADD CONSTRAINT "_footer_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _footer_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_footer_v_version_links_locales" ADD CONSTRAINT "_footer_v_version_links_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _footer_v_version_links(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_footer_v_version_links" ADD CONSTRAINT "_footer_v_version_links_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _footer_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _hero_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY (version_meta_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_version_resume_cta_file_id_media_id_fk" FOREIGN KEY (version_resume_cta_file_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_hero_v_version_highlights" ADD CONSTRAINT "_hero_v_version_highlights_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _hero_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_journal_v_locales" ADD CONSTRAINT "_journal_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _journal_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_journal_v_locales" ADD CONSTRAINT "_journal_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY (version_meta_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_journal_v" ADD CONSTRAINT "_journal_v_parent_id_journal_id_fk" FOREIGN KEY (parent_id) REFERENCES journal(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_journal_v_rels" ADD CONSTRAINT "_journal_v_rels_media_fk" FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_journal_v_rels" ADD CONSTRAINT "_journal_v_rels_parent_fk" FOREIGN KEY (parent_id) REFERENCES _journal_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_journal_v" ADD CONSTRAINT "_journal_v_version_category_id_categories_id_fk" FOREIGN KEY (version_category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_journal_v" ADD CONSTRAINT "_journal_v_version_cover_image_id_media_id_fk" FOREIGN KEY (version_cover_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_journal_v_version_tags" ADD CONSTRAINT "_journal_v_version_tags_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _journal_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_navigation_v_version_items_locales" ADD CONSTRAINT "_navigation_v_version_items_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _navigation_v_version_items(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _navigation_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _projects_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY (version_meta_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY (parent_id) REFERENCES _projects_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_technologies_fk" FOREIGN KEY (technologies_id) REFERENCES technologies(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_projects_v" ADD CONSTRAINT "_projects_v_version_category_id_categories_id_fk" FOREIGN KEY (version_category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_dark_id_media_id_fk" FOREIGN KEY (version_cover_image_dark_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_id_media_id_fk" FOREIGN KEY (version_cover_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_sections_content_v_locales" ADD CONSTRAINT "_sections_content_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _sections_content_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_settings_v_locales" ADD CONSTRAINT "_settings_v_locales_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _settings_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "_settings_v" ADD CONSTRAINT "_settings_v_version_logo_id_media_id_fk" FOREIGN KEY (version_logo_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_settings_v" ADD CONSTRAINT "_settings_v_version_photo_id_media_id_fk" FOREIGN KEY (version_photo_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_settings_v" ADD CONSTRAINT "_settings_v_version_seo_default_image_id_media_id_fk" FOREIGN KEY (version_seo_default_image_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_settings_v_version_social_links" ADD CONSTRAINT "_settings_v_version_social_links_icon_id_media_id_fk" FOREIGN KEY (icon_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE ONLY "_settings_v_version_social_links" ADD CONSTRAINT "_settings_v_version_social_links_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES _settings_v(id) ON DELETE CASCADE;
ALTER TABLE ONLY "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY (_parent_id) REFERENCES payload_jobs(id) ON DELETE CASCADE;
ALTER TABLE ONLY "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY (redirects_id) REFERENCES redirects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "redirects_rels" ADD CONSTRAINT "redirects_rels_journal_fk" FOREIGN KEY (journal_id) REFERENCES journal(id) ON DELETE CASCADE;
ALTER TABLE ONLY "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY (parent_id) REFERENCES redirects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "redirects_rels" ADD CONSTRAINT "redirects_rels_projects_fk" FOREIGN KEY (projects_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 10. Indexes.
CREATE INDEX _about_v_autosave_idx ON _about_v USING btree (autosave);
CREATE INDEX _about_v_created_at_idx ON _about_v USING btree (created_at);
CREATE INDEX _about_v_latest_idx ON _about_v USING btree (latest);
CREATE UNIQUE INDEX _about_v_locales_locale_parent_id_unique ON _about_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _about_v_published_locale_idx ON _about_v USING btree (published_locale);
CREATE INDEX _about_v_snapshot_idx ON _about_v USING btree (snapshot);
CREATE INDEX _about_v_updated_at_idx ON _about_v USING btree (updated_at);
CREATE INDEX _about_v_version_point_groups_locale_idx ON _about_v_version_point_groups USING btree (_locale);
CREATE INDEX _about_v_version_point_groups_order_idx ON _about_v_version_point_groups USING btree (_order);
CREATE INDEX _about_v_version_point_groups_parent_id_idx ON _about_v_version_point_groups USING btree (_parent_id);
CREATE INDEX _about_v_version_version__status_idx ON _about_v USING btree (version__status);
CREATE INDEX _about_v_version_version_portrait_idx ON _about_v USING btree (version_portrait_id);
CREATE INDEX _contact_v_autosave_idx ON _contact_v USING btree (autosave);
CREATE INDEX _contact_v_created_at_idx ON _contact_v USING btree (created_at);
CREATE INDEX _contact_v_latest_idx ON _contact_v USING btree (latest);
CREATE UNIQUE INDEX _contact_v_locales_locale_parent_id_unique ON _contact_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _contact_v_published_locale_idx ON _contact_v USING btree (published_locale);
CREATE INDEX _contact_v_snapshot_idx ON _contact_v USING btree (snapshot);
CREATE INDEX _contact_v_updated_at_idx ON _contact_v USING btree (updated_at);
CREATE INDEX _contact_v_version_version__status_idx ON _contact_v USING btree (version__status);
CREATE INDEX _footer_v_autosave_idx ON _footer_v USING btree (autosave);
CREATE INDEX _footer_v_created_at_idx ON _footer_v USING btree (created_at);
CREATE INDEX _footer_v_latest_idx ON _footer_v USING btree (latest);
CREATE UNIQUE INDEX _footer_v_locales_locale_parent_id_unique ON _footer_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _footer_v_published_locale_idx ON _footer_v USING btree (published_locale);
CREATE INDEX _footer_v_snapshot_idx ON _footer_v USING btree (snapshot);
CREATE INDEX _footer_v_updated_at_idx ON _footer_v USING btree (updated_at);
CREATE UNIQUE INDEX _footer_v_version_links_locales_locale_parent_id_unique ON _footer_v_version_links_locales USING btree (_locale, _parent_id);
CREATE INDEX _footer_v_version_links_order_idx ON _footer_v_version_links USING btree (_order);
CREATE INDEX _footer_v_version_links_parent_id_idx ON _footer_v_version_links USING btree (_parent_id);
CREATE INDEX _footer_v_version_version__status_idx ON _footer_v USING btree (version__status);
CREATE INDEX _hero_v_autosave_idx ON _hero_v USING btree (autosave);
CREATE INDEX _hero_v_created_at_idx ON _hero_v USING btree (created_at);
CREATE INDEX _hero_v_latest_idx ON _hero_v USING btree (latest);
CREATE UNIQUE INDEX _hero_v_locales_locale_parent_id_unique ON _hero_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _hero_v_published_locale_idx ON _hero_v USING btree (published_locale);
CREATE INDEX _hero_v_snapshot_idx ON _hero_v USING btree (snapshot);
CREATE INDEX _hero_v_updated_at_idx ON _hero_v USING btree (updated_at);
CREATE INDEX _hero_v_version_highlights_locale_idx ON _hero_v_version_highlights USING btree (_locale);
CREATE INDEX _hero_v_version_highlights_order_idx ON _hero_v_version_highlights USING btree (_order);
CREATE INDEX _hero_v_version_highlights_parent_id_idx ON _hero_v_version_highlights USING btree (_parent_id);
CREATE INDEX _hero_v_version_meta_version_meta_image_idx ON _hero_v_locales USING btree (version_meta_image_id, _locale);
CREATE INDEX _hero_v_version_resume_cta_version_resume_cta_file_idx ON _hero_v_locales USING btree (version_resume_cta_file_id, _locale);
CREATE INDEX _hero_v_version_version__status_idx ON _hero_v USING btree (version__status);
CREATE INDEX _journal_v_autosave_idx ON _journal_v USING btree (autosave);
CREATE INDEX _journal_v_created_at_idx ON _journal_v USING btree (created_at);
CREATE INDEX _journal_v_latest_idx ON _journal_v USING btree (latest);
CREATE UNIQUE INDEX _journal_v_locales_locale_parent_id_unique ON _journal_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _journal_v_parent_idx ON _journal_v USING btree (parent_id);
CREATE INDEX _journal_v_published_locale_idx ON _journal_v USING btree (published_locale);
CREATE INDEX _journal_v_rels_media_id_idx ON _journal_v_rels USING btree (media_id);
CREATE INDEX _journal_v_rels_order_idx ON _journal_v_rels USING btree ("order");
CREATE INDEX _journal_v_rels_parent_idx ON _journal_v_rels USING btree (parent_id);
CREATE INDEX _journal_v_rels_path_idx ON _journal_v_rels USING btree (path);
CREATE INDEX _journal_v_snapshot_idx ON _journal_v USING btree (snapshot);
CREATE INDEX _journal_v_updated_at_idx ON _journal_v USING btree (updated_at);
CREATE INDEX _journal_v_version_meta_version_meta_image_idx ON _journal_v_locales USING btree (version_meta_image_id, _locale);
CREATE INDEX _journal_v_version_tags_order_idx ON _journal_v_version_tags USING btree (_order);
CREATE INDEX _journal_v_version_tags_parent_id_idx ON _journal_v_version_tags USING btree (_parent_id);
CREATE INDEX _journal_v_version_version__status_idx ON _journal_v USING btree (version__status);
CREATE INDEX _journal_v_version_version_category_idx ON _journal_v USING btree (version_category_id);
CREATE INDEX _journal_v_version_version_cover_image_idx ON _journal_v USING btree (version_cover_image_id);
CREATE INDEX _journal_v_version_version_created_at_idx ON _journal_v USING btree (version_created_at);
CREATE INDEX _journal_v_version_version_featured_idx ON _journal_v USING btree (version_featured);
CREATE INDEX _journal_v_version_version_slug_idx ON _journal_v USING btree (version_slug);
CREATE INDEX _journal_v_version_version_updated_at_idx ON _journal_v USING btree (version_updated_at);
CREATE INDEX _navigation_v_autosave_idx ON _navigation_v USING btree (autosave);
CREATE INDEX _navigation_v_created_at_idx ON _navigation_v USING btree (created_at);
CREATE INDEX _navigation_v_latest_idx ON _navigation_v USING btree (latest);
CREATE INDEX _navigation_v_published_locale_idx ON _navigation_v USING btree (published_locale);
CREATE INDEX _navigation_v_snapshot_idx ON _navigation_v USING btree (snapshot);
CREATE INDEX _navigation_v_updated_at_idx ON _navigation_v USING btree (updated_at);
CREATE UNIQUE INDEX _navigation_v_version_items_locales_locale_parent_id_unique ON _navigation_v_version_items_locales USING btree (_locale, _parent_id);
CREATE INDEX _navigation_v_version_items_order_idx ON _navigation_v_version_items USING btree (_order);
CREATE INDEX _navigation_v_version_items_parent_id_idx ON _navigation_v_version_items USING btree (_parent_id);
CREATE INDEX _navigation_v_version_version__status_idx ON _navigation_v USING btree (version__status);
CREATE INDEX _projects_v_autosave_idx ON _projects_v USING btree (autosave);
CREATE INDEX _projects_v_created_at_idx ON _projects_v USING btree (created_at);
CREATE INDEX _projects_v_latest_idx ON _projects_v USING btree (latest);
CREATE UNIQUE INDEX _projects_v_locales_locale_parent_id_unique ON _projects_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _projects_v_parent_idx ON _projects_v USING btree (parent_id);
CREATE INDEX _projects_v_published_locale_idx ON _projects_v USING btree (published_locale);
CREATE INDEX _projects_v_rels_media_id_idx ON _projects_v_rels USING btree (media_id);
CREATE INDEX _projects_v_rels_order_idx ON _projects_v_rels USING btree ("order");
CREATE INDEX _projects_v_rels_parent_idx ON _projects_v_rels USING btree (parent_id);
CREATE INDEX _projects_v_rels_path_idx ON _projects_v_rels USING btree (path);
CREATE INDEX _projects_v_rels_technologies_id_idx ON _projects_v_rels USING btree (technologies_id);
CREATE INDEX _projects_v_snapshot_idx ON _projects_v USING btree (snapshot);
CREATE INDEX _projects_v_updated_at_idx ON _projects_v USING btree (updated_at);
CREATE INDEX _projects_v_version_meta_version_meta_image_idx ON _projects_v_locales USING btree (version_meta_image_id, _locale);
CREATE INDEX _projects_v_version_version__status_idx ON _projects_v USING btree (version__status);
CREATE INDEX _projects_v_version_version_category_idx ON _projects_v USING btree (version_category_id);
CREATE INDEX _projects_v_version_version_cover_image_dark_idx ON _projects_v USING btree (version_cover_image_dark_id);
CREATE INDEX _projects_v_version_version_cover_image_idx ON _projects_v USING btree (version_cover_image_id);
CREATE INDEX _projects_v_version_version_created_at_idx ON _projects_v USING btree (version_created_at);
CREATE INDEX _projects_v_version_version_featured_idx ON _projects_v USING btree (version_featured);
CREATE INDEX _projects_v_version_version_slug_idx ON _projects_v USING btree (version_slug);
CREATE INDEX _projects_v_version_version_updated_at_idx ON _projects_v USING btree (version_updated_at);
CREATE INDEX _sections_content_v_autosave_idx ON _sections_content_v USING btree (autosave);
CREATE INDEX _sections_content_v_created_at_idx ON _sections_content_v USING btree (created_at);
CREATE INDEX _sections_content_v_latest_idx ON _sections_content_v USING btree (latest);
CREATE UNIQUE INDEX _sections_content_v_locales_locale_parent_id_unique ON _sections_content_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _sections_content_v_published_locale_idx ON _sections_content_v USING btree (published_locale);
CREATE INDEX _sections_content_v_snapshot_idx ON _sections_content_v USING btree (snapshot);
CREATE INDEX _sections_content_v_updated_at_idx ON _sections_content_v USING btree (updated_at);
CREATE INDEX _sections_content_v_version_version__status_idx ON _sections_content_v USING btree (version__status);
CREATE INDEX _sections_visibility_v_autosave_idx ON _sections_visibility_v USING btree (autosave);
CREATE INDEX _sections_visibility_v_created_at_idx ON _sections_visibility_v USING btree (created_at);
CREATE INDEX _sections_visibility_v_latest_idx ON _sections_visibility_v USING btree (latest);
CREATE INDEX _sections_visibility_v_published_locale_idx ON _sections_visibility_v USING btree (published_locale);
CREATE INDEX _sections_visibility_v_snapshot_idx ON _sections_visibility_v USING btree (snapshot);
CREATE INDEX _sections_visibility_v_updated_at_idx ON _sections_visibility_v USING btree (updated_at);
CREATE INDEX _sections_visibility_v_version_version__status_idx ON _sections_visibility_v USING btree (version__status);
CREATE INDEX _settings_v_autosave_idx ON _settings_v USING btree (autosave);
CREATE INDEX _settings_v_created_at_idx ON _settings_v USING btree (created_at);
CREATE INDEX _settings_v_latest_idx ON _settings_v USING btree (latest);
CREATE UNIQUE INDEX _settings_v_locales_locale_parent_id_unique ON _settings_v_locales USING btree (_locale, _parent_id);
CREATE INDEX _settings_v_published_locale_idx ON _settings_v USING btree (published_locale);
CREATE INDEX _settings_v_snapshot_idx ON _settings_v USING btree (snapshot);
CREATE INDEX _settings_v_updated_at_idx ON _settings_v USING btree (updated_at);
CREATE INDEX _settings_v_version_seo_version_seo_default_image_idx ON _settings_v USING btree (version_seo_default_image_id);
CREATE INDEX _settings_v_version_social_links_icon_idx ON _settings_v_version_social_links USING btree (icon_id);
CREATE INDEX _settings_v_version_social_links_order_idx ON _settings_v_version_social_links USING btree (_order);
CREATE INDEX _settings_v_version_social_links_parent_id_idx ON _settings_v_version_social_links USING btree (_parent_id);
CREATE INDEX _settings_v_version_version__status_idx ON _settings_v USING btree (version__status);
CREATE INDEX _settings_v_version_version_logo_idx ON _settings_v USING btree (version_logo_id);
CREATE INDEX _settings_v_version_version_photo_idx ON _settings_v USING btree (version_photo_id);
CREATE INDEX about__status_idx ON about USING btree (_status);
CREATE INDEX contact__status_idx ON contact USING btree (_status);
CREATE INDEX footer__status_idx ON footer USING btree (_status);
CREATE INDEX hero__status_idx ON hero USING btree (_status);
CREATE INDEX journal__status_idx ON journal USING btree (_status);
CREATE INDEX navigation__status_idx ON navigation USING btree (_status);
CREATE INDEX payload_jobs_completed_at_idx ON payload_jobs USING btree (completed_at);
CREATE INDEX payload_jobs_created_at_idx ON payload_jobs USING btree (created_at);
CREATE INDEX payload_jobs_has_error_idx ON payload_jobs USING btree (has_error);
CREATE INDEX payload_jobs_log_order_idx ON payload_jobs_log USING btree (_order);
CREATE INDEX payload_jobs_log_parent_id_idx ON payload_jobs_log USING btree (_parent_id);
CREATE INDEX payload_jobs_processing_idx ON payload_jobs USING btree (processing);
CREATE INDEX payload_jobs_queue_idx ON payload_jobs USING btree (queue);
CREATE INDEX payload_jobs_task_slug_idx ON payload_jobs USING btree (task_slug);
CREATE INDEX payload_jobs_total_tried_idx ON payload_jobs USING btree (total_tried);
CREATE INDEX payload_jobs_updated_at_idx ON payload_jobs USING btree (updated_at);
CREATE INDEX payload_jobs_wait_until_idx ON payload_jobs USING btree (wait_until);
CREATE INDEX payload_locked_documents_rels_redirects_id_idx ON payload_locked_documents_rels USING btree (redirects_id);
CREATE INDEX projects__status_idx ON projects USING btree (_status);
CREATE INDEX redirects_created_at_idx ON redirects USING btree (created_at);
CREATE UNIQUE INDEX redirects_from_idx ON redirects USING btree ("from");
CREATE INDEX redirects_rels_journal_id_idx ON redirects_rels USING btree (journal_id);
CREATE INDEX redirects_rels_order_idx ON redirects_rels USING btree ("order");
CREATE INDEX redirects_rels_parent_idx ON redirects_rels USING btree (parent_id);
CREATE INDEX redirects_rels_path_idx ON redirects_rels USING btree (path);
CREATE INDEX redirects_rels_projects_id_idx ON redirects_rels USING btree (projects_id);
CREATE INDEX redirects_updated_at_idx ON redirects USING btree (updated_at);
CREATE INDEX sections_content__status_idx ON sections_content USING btree (_status);
CREATE INDEX sections_visibility__status_idx ON sections_visibility USING btree (_status);
CREATE INDEX settings__status_idx ON settings USING btree (_status);

-- 11. Retire the old visibility enums.
DROP TYPE "enum_journal_visibility";
DROP TYPE "enum_projects_visibility";
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
-- Tear down the version/jobs/redirects infrastructure and restore the
-- visibility columns. Draft-only content has no equivalent in the old shape,
-- so it comes back as private — the closest match.
CREATE TYPE "enum_projects_visibility" AS ENUM('public', 'private');
CREATE TYPE "enum_journal_visibility" AS ENUM('public', 'private');
ALTER TABLE "projects" ADD COLUMN "visibility" "enum_projects_visibility" DEFAULT 'public' NOT NULL;
ALTER TABLE "journal" ADD COLUMN "visibility" "enum_journal_visibility" DEFAULT 'public' NOT NULL;
UPDATE "projects" SET "visibility" = CASE WHEN "_status" = 'published' THEN 'public'::"enum_projects_visibility" ELSE 'private'::"enum_projects_visibility" END;
UPDATE "journal" SET "visibility" = CASE WHEN "_status" = 'published' THEN 'public'::"enum_journal_visibility" ELSE 'private'::"enum_journal_visibility" END;

-- Version, jobs and redirect tables go away entirely.
DROP TABLE IF EXISTS "redirects_rels" CASCADE;
DROP TABLE IF EXISTS "redirects" CASCADE;
DROP TABLE IF EXISTS "payload_jobs_log" CASCADE;
DROP TABLE IF EXISTS "payload_jobs" CASCADE;
DROP TABLE IF EXISTS "_settings_v_version_social_links" CASCADE;
DROP TABLE IF EXISTS "_settings_v_locales" CASCADE;
DROP TABLE IF EXISTS "_settings_v" CASCADE;
DROP TABLE IF EXISTS "_sections_visibility_v" CASCADE;
DROP TABLE IF EXISTS "_sections_content_v_locales" CASCADE;
DROP TABLE IF EXISTS "_sections_content_v" CASCADE;
DROP TABLE IF EXISTS "_projects_v_rels" CASCADE;
DROP TABLE IF EXISTS "_projects_v_locales" CASCADE;
DROP TABLE IF EXISTS "_projects_v" CASCADE;
DROP TABLE IF EXISTS "_navigation_v_version_items_locales" CASCADE;
DROP TABLE IF EXISTS "_navigation_v_version_items" CASCADE;
DROP TABLE IF EXISTS "_navigation_v" CASCADE;
DROP TABLE IF EXISTS "_journal_v_version_tags" CASCADE;
DROP TABLE IF EXISTS "_journal_v_rels" CASCADE;
DROP TABLE IF EXISTS "_journal_v_locales" CASCADE;
DROP TABLE IF EXISTS "_journal_v" CASCADE;
DROP TABLE IF EXISTS "_hero_v_version_highlights" CASCADE;
DROP TABLE IF EXISTS "_hero_v_locales" CASCADE;
DROP TABLE IF EXISTS "_hero_v" CASCADE;
DROP TABLE IF EXISTS "_footer_v_version_links_locales" CASCADE;
DROP TABLE IF EXISTS "_footer_v_version_links" CASCADE;
DROP TABLE IF EXISTS "_footer_v_locales" CASCADE;
DROP TABLE IF EXISTS "_footer_v" CASCADE;
DROP TABLE IF EXISTS "_contact_v_locales" CASCADE;
DROP TABLE IF EXISTS "_contact_v" CASCADE;
DROP TABLE IF EXISTS "_about_v_version_point_groups" CASCADE;
DROP TABLE IF EXISTS "_about_v_locales" CASCADE;
DROP TABLE IF EXISTS "_about_v" CASCADE;

ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
ALTER TABLE "about" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "contact" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "footer" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "hero" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "journal" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "navigation" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "sections_content" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "sections_visibility" DROP COLUMN IF EXISTS "_status";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "_status";

-- Restore the columns that drafts made nullable.
ALTER TABLE "about_locales" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "about_point_groups" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "contact_locales" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "footer_links" ALTER COLUMN "href" SET NOT NULL;
ALTER TABLE "footer_links_locales" ALTER COLUMN "label" SET NOT NULL;
ALTER TABLE "hero_highlights" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "hero_locales" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "journal" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "short_description" SET NOT NULL;
ALTER TABLE "journal_locales" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "journal_tags" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "navigation_items" ALTER COLUMN "href" SET NOT NULL;
ALTER TABLE "navigation_items_locales" ALTER COLUMN "label" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "short_description" SET NOT NULL;
ALTER TABLE "projects_locales" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "projects_title" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "experience_title" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "education_title" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "skills_title" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "testimonials_title" SET NOT NULL;
ALTER TABLE "sections_content_locales" ALTER COLUMN "journal_title" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "theme_primary_color" SET NOT NULL;
ALTER TABLE "settings_social_links" ALTER COLUMN "platform" SET NOT NULL;
ALTER TABLE "settings_social_links" ALTER COLUMN "url" SET NOT NULL;

DROP TYPE IF EXISTS "enum__about_v_published_locale";
DROP TYPE IF EXISTS "enum__about_v_version_status";
DROP TYPE IF EXISTS "enum__contact_v_published_locale";
DROP TYPE IF EXISTS "enum__contact_v_version_status";
DROP TYPE IF EXISTS "enum__footer_v_published_locale";
DROP TYPE IF EXISTS "enum__footer_v_version_status";
DROP TYPE IF EXISTS "enum__hero_v_published_locale";
DROP TYPE IF EXISTS "enum__hero_v_version_status";
DROP TYPE IF EXISTS "enum__journal_v_published_locale";
DROP TYPE IF EXISTS "enum__journal_v_version_status";
DROP TYPE IF EXISTS "enum__navigation_v_published_locale";
DROP TYPE IF EXISTS "enum__navigation_v_version_status";
DROP TYPE IF EXISTS "enum__projects_v_published_locale";
DROP TYPE IF EXISTS "enum__projects_v_version_status";
DROP TYPE IF EXISTS "enum__sections_content_v_published_locale";
DROP TYPE IF EXISTS "enum__sections_content_v_version_status";
DROP TYPE IF EXISTS "enum__sections_visibility_v_published_locale";
DROP TYPE IF EXISTS "enum__sections_visibility_v_version_status";
DROP TYPE IF EXISTS "enum__settings_v_published_locale";
DROP TYPE IF EXISTS "enum__settings_v_version_social_links_platform";
DROP TYPE IF EXISTS "enum__settings_v_version_status";
DROP TYPE IF EXISTS "enum__settings_v_version_theme_accent_color";
DROP TYPE IF EXISTS "enum__settings_v_version_theme_cursor_effect";
DROP TYPE IF EXISTS "enum__settings_v_version_theme_default_theme";
DROP TYPE IF EXISTS "enum__settings_v_version_theme_primary_color";
DROP TYPE IF EXISTS "enum_about_status";
DROP TYPE IF EXISTS "enum_contact_status";
DROP TYPE IF EXISTS "enum_footer_status";
DROP TYPE IF EXISTS "enum_hero_status";
DROP TYPE IF EXISTS "enum_journal_status";
DROP TYPE IF EXISTS "enum_navigation_status";
DROP TYPE IF EXISTS "enum_payload_jobs_log_state";
DROP TYPE IF EXISTS "enum_payload_jobs_log_task_slug";
DROP TYPE IF EXISTS "enum_payload_jobs_task_slug";
DROP TYPE IF EXISTS "enum_redirects_to_type";
DROP TYPE IF EXISTS "enum_redirects_type";
DROP TYPE IF EXISTS "enum_sections_content_status";
DROP TYPE IF EXISTS "enum_sections_visibility_status";
DROP TYPE IF EXISTS "enum_settings_status";

DROP TYPE IF EXISTS "enum_projects_status";
ALTER TYPE "enum_projects_project_status" RENAME TO "enum_projects_status";
`)
}
