import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Skills: CollectionConfig = {
  slug: 'skills',
  admin: {
    group: 'Taxonomy',
    description: 'Skills grouped by category, shown in the skills section.',
    defaultColumns: ['logo', 'name', 'category', 'level'],
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
      name: 'level',
      type: 'select',
      options: [
        { label: 'Advanced', value: 'advanced' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Beginner', value: 'beginner' },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
}
