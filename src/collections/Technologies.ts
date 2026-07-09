import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Technologies: CollectionConfig = {
  slug: 'technologies',
  admin: {
    group: 'Taxonomy',
    description: 'Technology tags referenced by projects and experience entries.',
    defaultColumns: ['logo', 'name', 'category', 'color'],
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Optional hex color used in UI accents.',
        components: {
          Cell: '/components/admin/TechColorSwatchCell#TechColorSwatchCell',
        },
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: {
        group: { equals: 'tech' },
      },
    },
  ],
  timestamps: true,
}
