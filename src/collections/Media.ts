import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Site',
    description: 'Reusable images, logos and videos used across the site.',
    useAsTitle: 'alt',
    defaultColumns: ['preview', 'filename', 'alt', 'updatedAt'],
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
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
}
