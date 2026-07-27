import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Site',
    description: 'Reusable images, logos and videos used across the site.',
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    focalPoint: true,
    // Applies to the main uploaded file (not just the named sizes below).
    // Payload only runs this for raster formats it can resize (jpeg/png/gif/
    // webp/tiff/avif) — SVGs, PDFs and videos pass through untouched, so logos
    // stay vector and the résumé PDF is unaffected.
    resizeOptions: {
      width: 1920,
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
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
}
