import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'
import { withUniqueSuffix } from '@/lib/uploadFilename'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Média',
    plural: 'Médias',
  },
  admin: {
    group: adminGroups.site,
    description:
      'Images, logos et PDF réutilisables un peu partout sur le site. Les captures vidéo ont leur propre rubrique, « Vidéos ».',
    useAsTitle: 'alt',
    defaultColumns: ['preview', 'filename', 'alt', 'updatedAt'],
  },
  access: {
    // The files themselves are served straight from the R2 custom domain and
    // stay publicly fetchable — this only closes `/api/media`, which otherwise
    // enumerates every upload (including the images attached to private
    // projects) to anyone who asks. The site reads media through the Local
    // API, which bypasses access control, so pages are unaffected.
    read: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // Runs before Payload reads/resizes the incoming file, so the renamed
    // file is what gets written to R2 *and* what ends up in `doc.filename` /
    // `doc.url`. sharp's webp conversion still rewrites the extension after
    // this, so the suffix sits on the base name where we want it.
    beforeOperation: [
      ({ operation, req }) => {
        if (operation !== 'create' && operation !== 'update') return
        if (!req.file?.name) return

        req.file.name = withUniqueSuffix(req.file.name)
      },
    ],
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif',
      required: true,
    },
  ],
  upload: {
    focalPoint: true,
    // Applies to the main uploaded file (not just the named sizes below).
    // Payload only runs this for raster formats it can resize (jpeg/png/gif/
    // webp/tiff/avif) — SVGs, PDFs and videos pass through untouched, so logos
    // stay vector and the résumé PDF is unaffected.
    //
    // Bounding only `width` left portrait photos (phone shots) uncapped on
    // height: at 1920px wide they land near 1920x2900, ~2.3x the pixels of a
    // same-width landscape shot, and correspondingly heavier over the wire.
    // Since nothing here regenerates responsive/optimized variants at request
    // time (see `images.unoptimized` in next.config.ts), that full weight
    // hits the browser every time the lightbox opens one — landscape photos
    // pop in fast, portrait ones visibly lag behind the backdrop. Capping
    // `height` too (with `fit: 'inside'`) bounds the longer edge for either
    // orientation without cropping.
    resizeOptions: {
      width: 1920,
      height: 1920,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: {
      format: 'webp',
      options: { quality: 80 },
    },
    // No named imageSizes: getMediaUrl() (src/lib/media.ts) only ever reads
    // the main file's url, so thumbnail/card/hero derivatives were generated
    // and stored in R2 on every upload without a single component reading
    // them back.
    // Videos deliberately excluded: they belong in the `videos` collection,
    // whose storage instance bypasses the 4.5MB Vercel body limit that a
    // server-side upload here cannot clear. Leaving 'video/*' accepted would
    // just let a large capture be dropped in and fail with an opaque 413.
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
