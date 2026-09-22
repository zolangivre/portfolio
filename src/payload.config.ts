import { postgresAdapter } from '@payloadcms/db-postgres'
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
import { translateSeoFields } from './lib/adminLabels'
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
