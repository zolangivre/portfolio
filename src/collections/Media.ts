import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Media: CollectionConfig = {
  slug: 'media',
  // Adds the "By Folder" tab to the Media list view: folders can be created,
  // nested, and media dragged between them. Payload injects a hidden `folder`
  // relationship field on this collection pointing at `payload-folders`.
  folders: true,
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
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      // Videos here are large (the two product demos are ~21MB each), and a
      // <video> with no poster makes the browser fetch part of the file just
      // to paint the first frame. Pointing at a still image means the gallery
      // shows something immediately and the video is only fetched on play.
      admin: {
        description:
          'Still image shown before a video plays. Only used for video files — ignored for images.',
        condition: (data) => Boolean((data?.mimeType as string | undefined)?.startsWith('video/')),
      },
      filterOptions: {
        mimeType: { like: 'image' },
      },
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
    // Responsive ladder. These exist so getMediaSrcSet() (src/lib/media.ts)
    // can emit a real srcset — the previous named sizes were dropped because
    // nothing consumed them, which is the mistake being corrected here rather
    // than repeated.
    //
    // Widths are chosen from how the images are actually laid out: cards cap
    // around 375 CSS px (1200 covers 3x), the hero photo at 480, and detail
    // covers at 1160 (the 1920 original covers 2x there).
    //
    // `withoutEnlargement` is deliberately left undefined — Payload's default
    // returns null rather than upscaling, so small logos and avatars simply
    // produce no derivatives instead of wasting storage on blurry copies.
    // getMediaSrcSet() filters those nulls out.
    imageSizes: [
      { name: 'sm', width: 400, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'md', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'lg', width: 1200, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'xl', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
}
