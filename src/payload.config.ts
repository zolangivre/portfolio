import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { fr } from '@payloadcms/translations/languages/fr'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Videos } from './collections/Videos'
import { Experiences } from './collections/Experience'
import { Projects } from './collections/Projects'
import { Skills } from './collections/Skills'
import { Technologies } from './collections/Technologies'
import { Companies } from './collections/Companies'
import { Categories } from './collections/Categories'
import { Schools } from './collections/Schools'
import { Education } from './collections/Education'
import { Testimonials } from './collections/Testimonials'
import { Messages } from './collections/Messages'
import { Journal } from './collections/Journal'
import { redirectsConfig } from './collections/Redirects'
import { refuseGlobalUnpublishSchedule } from './collections/drafts'
import { canRunJobs } from './lib/access'
import { parseSender } from './lib/emailSender'
import { previewPath, previewURL } from './lib/preview'
import { adminGroups, translateSeoFields } from './lib/adminLabels'
import { GlobalSettings } from './globals/GlobalSettings'
import { Hero } from './globals/Hero'
import { About } from './globals/About'
import { Contact } from './globals/Contact'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'
import { SectionsVisibility } from './globals/SectionsVisibility'
import { SectionsContent } from './globals/SectionsContent'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Payload's own emails (the admin's "Mot de passe oublié") go through Resend,
// with the contact notification's key and sender (hooks/notifyNewMessage.ts).
// Without them Payload writes each email to the console, as local
// development and the tests want; in production that meant a reset link
// nobody received.
const emailSender = parseSender(process.env.CONTACT_NOTIFICATION_FROM)
const email =
  process.env.RESEND_API_KEY && emailSender
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: emailSender.address,
        defaultFromName: emailSender.name,
      })
    : undefined

/**
 * The R2 wiring shared by both s3Storage instances below. Held in one place so
 * the media/videos split stays a difference of `clientUploads` and nothing
 * else — a bucket or credential that drifted between the two would send half
 * the uploads somewhere unexpected.
 */
const r2StorageBase = {
  bucket: process.env.R2_BUCKET || '',
  enabled: Boolean(process.env.R2_ACCESS_KEY_ID),
  config: {
    region: 'auto',
    endpoint: process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
    // AWS SDK v3 (>= 3.729) checksums every request by default, and for a
    // pre-signed PUT it does so at signing time — before the browser has sent
    // a byte — so the URL carries `x-amz-checksum-crc32=AAAAAA==`, the CRC32
    // of an empty body. R2 then rejects every real upload, and since R2 puts
    // no CORS headers on error responses, the browser reports it as a CORS
    // failure rather than the checksum mismatch it is. Cloudflare's documented
    // fix for R2: only checksum when an operation actually requires it.
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
    responseChecksumValidation: 'WHEN_REQUIRED' as const,
  },
}

const r2CollectionBase = {
  // Serve files straight from the R2 custom domain instead of proxying every
  // read through Payload's /api/<collection>/file route — that route runs as a
  // Vercel function, so every image request was counting against Fast Origin
  // Transfer. Inert in local dev (falls back to disk storage, since
  // `enabled` is false).
  disablePayloadAccessControl: true as const,
}

/** The public R2 URL for a stored object, without any cache-busting. */
const r2FileURL = ({ filename, prefix }: { filename: string; prefix?: string }) => {
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')

  return `${base}/${prefix ? `${prefix}/` : ''}${filename}`
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '/components/admin/graphics/AdminLogo#AdminLogo',
      },
    },
    // The dashboard: what needs attention first, then Payload's own grid of
    // collections (the built-in `collections` widget). The widget API is
    // experimental in Payload 3 and slated for a redesign in v4.
    dashboard: {
      widgets: [
        {
          slug: 'unread-messages',
          Component: '/components/admin/dashboard/UnreadMessagesWidget#UnreadMessagesWidget',
          label: 'Messages non lus',
          minWidth: 'small',
        },
        {
          slug: 'pending-drafts',
          Component: '/components/admin/dashboard/PendingDraftsWidget#PendingDraftsWidget',
          label: 'Brouillons en cours',
          minWidth: 'small',
        },
        {
          slug: 'scheduled-publishes',
          Component:
            '/components/admin/dashboard/ScheduledPublishesWidget#ScheduledPublishesWidget',
          label: 'Publications programmées',
          minWidth: 'small',
        },
        {
          slug: 'recent-changes',
          Component: '/components/admin/dashboard/RecentChangesWidget#RecentChangesWidget',
          label: 'Dernières modifications',
          minWidth: 'small',
        },
      ],
      defaultLayout: [
        { widgetSlug: 'unread-messages', width: 'medium' },
        { widgetSlug: 'pending-drafts', width: 'medium' },
        { widgetSlug: 'scheduled-publishes', width: 'medium' },
        { widgetSlug: 'recent-changes', width: 'medium' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    // Every document the site renders can be previewed in place: a project or
    // a journal entry on its own page, everything else on the homepage, in
    // the locale being edited (lib/preview.ts). The panel opens on demand.
    livePreview: {
      collections: [
        'projects',
        'journal',
        'experiences',
        'education',
        'testimonials',
        'categories',
        'skills',
      ],
      globals: [
        'hero',
        'about',
        'contact',
        'navigation',
        'footer',
        'settings',
        'sections-content',
        'sections-visibility',
      ],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablette', name: 'tablet', width: 820, height: 1180 },
        { label: 'Ordinateur', name: 'desktop', width: 1440, height: 900 },
      ],
      url: ({ collectionConfig, data, globalConfig, locale, req }) =>
        previewURL({
          headers: req.headers,
          path: previewPath({
            collection: collectionConfig?.slug,
            data,
            global: globalConfig?.slug,
            locale: locale.code,
          }),
        }),
    },
  },
  collections: [
    Users,
    Media,
    Videos,
    Projects,
    Experiences,
    Skills,
    Technologies,
    Categories,
    Companies,
    Schools,
    Education,
    Testimonials,
    Messages,
    Journal,
  ],
  // The folders media and videos are sorted into (`folders: true` on each).
  // Payload builds the folder collection itself, with English labels; this
  // only translates them. Deleting a folder deletes its subfolders and moves
  // the files it held back to the root, never deletes a file.
  folders: {
    collectionOverrides: [
      ({ collection }) => ({
        ...collection,
        labels: { singular: 'Dossier', plural: 'Dossiers' },
        fields: collection.fields.map((field) => {
          if (!('name' in field)) return field
          if (field.name === 'name') return { ...field, label: 'Nom' }
          if (field.name === 'folderType') return { ...field, label: 'Peut contenir' }
          return field
        }),
      }),
    ],
  },
  globals: [
    GlobalSettings,
    Hero,
    About,
    Contact,
    Navigation,
    Footer,
    SectionsVisibility,
    SectionsContent,
  ],
  editor: lexicalEditor(),
  // The admin panel is French-only — separate from the site's content locales
  // below, which translate the values editors type in. Listing `fr` alone is
  // what pins it: Payload picks the request's Accept-Language whenever that
  // language is supported, and only falls back otherwise. Labels throughout
  // the config are plain French strings to match; adding a second language
  // here means translating them too (Payload takes a Record<lang, string>
  // anywhere it takes a label).
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },
  // The queue only holds the scheduled publishes of the collections with
  // drafts (collections/drafts.ts). Nothing runs it in-process — Vercel's
  // functions don't stay alive between requests — so the daily cron in
  // vercel.json calls /api/payload-jobs/run instead.
  jobs: {
    access: { run: canRunJobs },
    // Queued jobs go through the Local API (and its hooks) instead of a raw
    // insert, so the jobs collection can refuse a scheduled unpublish of a
    // global.
    runHooks: true,
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      hooks: {
        ...defaultJobsCollection.hooks,
        beforeChange: [
          ...(defaultJobsCollection.hooks?.beforeChange ?? []),
          refuseGlobalUnpublishSchedule,
        ],
      },
    }),
  },
  email,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    // Off in the test suites (.env.test, .env.e2e): they load this config
    // without the R2 keys, which drops the storage plugin's fields, and the
    // regenerated file would lose them.
    autoGenerate: process.env.PAYLOAD_AUTOGENERATE_TYPES !== 'false',
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [
      { label: 'Français', code: 'fr' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  db: postgresAdapter({
    // Dev push keeps the local database in sync automatically. CI builds its
    // database from migrations instead — PAYLOAD_DB_PUSH=false prevents push
    // from detecting a schema drift and hanging on an interactive prompt.
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    // MCP: lets an MCP client (Claude) read and edit the site's content with
    // an API key an editor creates in the admin (docs/ai/mcp.md). No
    // deletion, no contact messages, accounts or files; and whatever it
    // writes in a collection with drafts, or a global, is saved as a draft
    // (hooks/mcpWritesAreDrafts.ts) for the editor to review and publish.
    mcpPlugin({
      collections: {
        projects: {
          description:
            'Portfolio projects shown on the site, each with its own page (title, descriptions, technologies, links, images).',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        journal: {
          description:
            'Personal journal entries (travel, sport, achievements), each with its own page.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        experiences: {
          description: 'Work experience entries of the timeline.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        education: {
          description: 'Education entries of the timeline.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        testimonials: {
          description: 'Quotes from clients and colleagues.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        skills: {
          description: 'Skills shown in the skills section, grouped by category.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        technologies: {
          description: 'Technologies referenced by projects and experiences.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        categories: {
          description: 'Categories shared by skills, technologies, projects and journal entries.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        companies: {
          description: 'Companies referenced by experiences and testimonials.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
        schools: {
          description: 'Schools referenced by education entries.',
          enabled: { create: true, delete: false, find: true, update: true },
        },
      },
      globals: {
        hero: {
          description: 'The homepage banner.',
          enabled: { find: true, update: true },
        },
        about: {
          description: 'The about section.',
          enabled: { find: true, update: true },
        },
        contact: {
          description: 'The contact section.',
          enabled: { find: true, update: true },
        },
        navigation: {
          description: 'The header navigation links.',
          enabled: { find: true, update: true },
        },
        footer: {
          description: 'The footer text and links.',
          enabled: { find: true, update: true },
        },
        settings: {
          description: 'Site-wide settings: identity, theme, social links, default SEO.',
          enabled: { find: true, update: true },
        },
        'sections-content': {
          description: 'Eyebrow, title and description above each homepage section.',
          enabled: { find: true, update: true },
        },
        'sections-visibility': {
          description: 'Which sections the site shows.',
          enabled: { find: true, update: true },
        },
      },
      overrideApiKeyCollection: (collection) => ({
        ...collection,
        labels: { singular: 'Clé d’API MCP', plural: 'Clés d’API MCP' },
        admin: {
          ...collection.admin,
          group: adminGroups.site,
          description:
            'Clés qui permettent à un client MCP (Claude) de lire et modifier le contenu. Chaque clé agit au nom de son utilisateur, dans les limites cochées ; ce qu’elle écrit reste en brouillon.',
        },
      }),
    }),
    // Redirects: an old URL of the site sends visitors on (collections/Redirects.ts).
    redirectsPlugin(redirectsConfig),
    seoPlugin({
      collections: ['projects', 'journal'],
      globals: ['hero'],
      uploadsCollection: 'media',
      fields: translateSeoFields,
      generateTitle: ({ doc }) => {
        const title = (doc as { title?: string })?.title
        return title ? `${title} | Developer Portfolio` : 'Developer Portfolio'
      },
      generateDescription: ({ doc }) => {
        const shortDescription = (doc as { shortDescription?: string })?.shortDescription
        return shortDescription ?? ''
      },
    }),
    // Falls back to local disk storage when R2 credentials are unset (local
    // dev), and uploads to Cloudflare R2 when they're set (production).
    //
    // Two instances, one bucket, differing on `clientUploads` alone — see the
    // header of collections/Videos.ts for why the split exists. The plugin
    // supports being applied more than once: initClientUploads() suffixes the
    // signed-URL endpoint ('-1', '-2', …) and registers its browser handler
    // per collection slug, so the two never collide.
    s3Storage({
      ...r2StorageBase,
      collections: {
        media: {
          ...r2CollectionBase,
          generateFileURL: ({ filename, prefix }) => r2FileURL({ filename, prefix }),
        },
      },
      // Uploads go through the server, which is what lets sharp run: the
      // resize-to-1920 and webp rewrite in Media.ts only happen when Payload
      // holds the bytes. The ceiling that buys is Vercel's 4.5MB request body
      // limit — images clear it comfortably, which is exactly why videos live
      // in their own collection rather than here.
      clientUploads: false,
    }),
    s3Storage({
      ...r2StorageBase,
      collections: {
        videos: {
          ...r2CollectionBase,
          // Keyed under their own folder: getSafeFileName dedupes within a
          // collection only, so a `demo.mp4` in videos and one in media would
          // otherwise resolve to the same R2 key and overwrite each other.
          prefix: 'videos',
          // Same plain URL as media. The cache-busting that videos need — a
          // client upload never runs Media.ts's `withUniqueSuffix` hook, so a
          // delete-then-reupload reuses the R2 key — can't happen here: the
          // plugin calls generateFileURL with { collection, filename, prefix,
          // size } only, never the doc, so there is nothing to key a version
          // on. lib/media.ts stamps it at read time instead.
          generateFileURL: ({ filename, prefix }) => r2FileURL({ filename, prefix }),
        },
      },
      // The whole point of the split: the browser PUTs straight to R2 via a
      // pre-signed URL, so a 30MB capture never passes through a function and
      // never meets the 4.5MB body limit. Requires the bucket to allow CORS
      // PUT from the site's origin.
      clientUploads: true,
    }),
  ],
})
