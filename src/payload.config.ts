import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
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
  },
  collections: [
    Users,
    Media,
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
  // Folder organisation for collections that opt in with `folders: true`
  // (currently only Media). Payload auto-creates the `payload-folders`
  // collection that stores the tree.
  folders: {
    browseByFolder: true,
    // Media is the only folder-enabled collection, so scoping each folder to a
    // set of collections would just add a mandatory picker with one choice.
    // Turning it off means folders are global — flip back to true (the default)
    // if another collection ever opts in and needs its own separate tree.
    collectionSpecific: false,
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
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [
      { label: 'Français', code: 'fr' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'fr',
    fallback: true,
    // With drafts enabled, the Publish button offers "publish all locales" or
    // "publish only the locale I'm editing". 'active' makes the latter the
    // default, so translating the English copy can't accidentally push
    // half-finished French edits live.
    defaultLocalePublishOption: 'active',
  },
  // Scheduled publish/unpublish runs through Payload's jobs queue. Payload
  // registers the `schedulePublish` task automatically for every collection and
  // global that enables it; this section only controls who may run the queue.
  jobs: {
    access: {
      // The /api/payload-jobs/run endpoint defaults to PUBLIC. Without this,
      // anyone could trigger the queue. Vercel Cron sends the project's
      // CRON_SECRET as a bearer token; a logged-in admin can also run it.
      run: ({ req }) => {
        if (req.user) {
          return true
        }

        const secret = process.env.CRON_SECRET

        if (!secret) {
          return false
        }

        return req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
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
    // 301s for renamed slugs, so old links and search results keep working.
    // Consumed by getRedirect() at the 404 boundary of the detail pages.
    redirectsPlugin({
      collections: ['projects', 'journal'],
      redirectTypes: ['301', '302'],
      overrides: {
        admin: {
          group: 'Site',
          description: 'Send old URLs to their new home after renaming a slug.',
        },
      },
    }),
    seoPlugin({
      collections: ['projects', 'journal'],
      globals: ['hero'],
      uploadsCollection: 'media',
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
    s3Storage({
      collections: {
        media: {
          // Serve files straight from the R2 custom domain instead of
          // proxying every read through Payload's /api/media/file route —
          // that route runs as a Vercel function, so every image request
          // was counting against Fast Origin Transfer. Inert in local dev
          // (falls back to disk storage below, since `enabled` is false).
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
            return `${base}/${prefix ? `${prefix}/` : ''}${filename}`
          },
        },
      },
      bucket: process.env.R2_BUCKET || '',
      enabled: Boolean(process.env.R2_ACCESS_KEY_ID),
      // Uploads go straight from the browser to R2, bypassing the server so
      // large files aren't capped by the platform's request body size limit.
      clientUploads: true,
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
      },
    }),
  ],
})
