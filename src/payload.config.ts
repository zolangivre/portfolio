import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
    // Falls back to local disk storage when BLOB_READ_WRITE_TOKEN is unset
    // (local dev), and uploads to Vercel Blob when it's set (production).
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
