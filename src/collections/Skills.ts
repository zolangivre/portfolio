import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Skills: CollectionConfig = {
  slug: 'skills',
  admin: {
    group: 'Taxonomy',
    description: 'Skills grouped by category, shown in the skills section.',
    defaultColumns: ['logo', 'name', 'category', 'url'],
    useAsTitle: 'name',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: {
        group: { equals: 'tech' },
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description:
          'Optional link to the official documentation or website. Makes the whole card clickable.',
      },
      validate: (value: string | null | undefined) => {
        if (value == null || value === '') return true
        try {
          new URL(value)
          return true
        } catch {
          return 'Enter a valid URL, including the protocol (e.g. https://example.com).'
        }
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'invertLogoInDarkMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Invert the logo colors when the site is in dark mode. Enable for black/dark logos so they stay visible on the dark theme.',
      },
    },
  ],
  timestamps: true,
}
