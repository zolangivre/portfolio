import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

/**
 * Screen recordings, split out of `media` for one reason: size.
 *
 * Uploads to `media` travel through a Vercel function, which rejects any
 * request body over 4.5MB with a 413 (FUNCTION_PAYLOAD_TOO_LARGE) — fine for
 * images, hopeless for a 30MB capture. This collection is served by a second
 * s3Storage instance with `clientUploads: true` (see payload.config.ts), so
 * the browser PUTs the file straight to R2 through a pre-signed URL and the
 * function only ever signs it. No body limit applies.
 *
 * The split exists so that `media` can keep the opposite setting: a
 * server-side upload is what lets sharp run, and sharp is what caps images at
 * 1920px and rewrites them to webp. Turning client uploads on globally to fix
 * videos would have silently switched that off for every image — the exact
 * regression d12b412 was written to undo.
 *
 * Nothing here resizes or transcodes: sharp only handles raster images, so a
 * video passes through untouched either way. Compress before uploading.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: {
    singular: 'Vidéo',
    plural: 'Vidéos',
  },
  admin: {
    group: adminGroups.site,
    description:
      'Captures vidéo (mockups, démos). Sans limite de taille, contrairement aux médias — mais compressez quand même : le fichier est téléchargé tel quel par les visiteurs.',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    // Mirrors Media: the files stay publicly fetchable from the R2 custom
    // domain, this only closes the collection endpoint that would otherwise
    // enumerate every upload.
    read: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif',
      required: true,
      admin: {
        description: 'Décrit ce que montre la vidéo — lu par les lecteurs d’écran.',
      },
    },
  ],
  upload: {
    // No resizeOptions/formatOptions: see the note above. No `withUniqueSuffix`
    // hook either — it keys off `req.file`, which a client upload never
    // produces. Payload still dedupes via getSafeFileName, so a name in use by
    // a live doc gets suffixed; the gap is delete-then-reupload, which
    // generateFileURL's cache-buster covers in payload.config.ts.
    mimeTypes: ['video/*'],
  },
}
