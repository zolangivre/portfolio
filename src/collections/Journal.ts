import type { CollectionConfig } from 'payload'

import { publishedOnly } from '@/access/publishedOnly'
import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'
import { buildPreviewURL } from '@/lib/preview'

export const Journal: CollectionConfig = {
  slug: 'journal',
  labels: {
    singular: 'Journal Entry',
    plural: 'Journal',
  },
  admin: {
    group: 'Journal',
    description:
      'Personal, non-technical stories — travel, sport, achievements, events, discoveries.',
    defaultColumns: ['coverImage', 'title', 'category', '_status', 'date', 'featured', 'order'],
    useAsTitle: 'title',
    // "Preview" button in the document header.
    preview: (data, { locale }) =>
      buildPreviewURL({ collection: 'journal', slug: data?.slug as string, locale }),
    // Side-by-side live preview while editing.
    livePreview: {
      url: ({ data, locale }) =>
        buildPreviewURL({ collection: 'journal', slug: data?.slug as string, locale: locale?.code }),
    },
  },
  defaultSort: 'order',
  // Replaces the old `visibility` field: an entry is on the site once it's
  // published, and invisible while it's a draft.
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  access: {
    read: publishedOnly,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: {
        group: { equals: 'journal' },
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'location',
      type: 'text',
      localized: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        step: 1,
        description:
          'Display order: 1 shows first, 2 second, etc. Leave empty to fall back to most recent date after ordered entries.',
      },
    },
  ],
  timestamps: true,
}
