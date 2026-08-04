import { postgresAdapter } from '@payloadcms/db-postgres'
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
      // Uploads go through the server (Vercel Functions now accept request
      // bodies up to 100MB, so the old body-size justification for client
      // uploads no longer applies). This also means sharp's resize/webp
      // conversion (see Media.ts formatOptions) reliably runs on every
      // upload instead of depending on a client-side PUT to R2 that could
      // silently fail without Payload noticing.
      clientUploads: false,
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
