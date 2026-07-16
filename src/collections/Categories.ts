import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  admin: {
    group: 'Taxonomy',
    description:
      'Shared categories used across Skills, Technologies, Projects and Journal. Grouped by domain so each collection only offers its relevant categories.',
    defaultColumns: ['name', 'group', 'order'],
    useAsTitle: 'name',
  },
  defaultSort: 'order',
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
      name: 'group',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Tech (Skills & Technologies)', value: 'tech' },
        { label: 'Projects', value: 'project' },
        { label: 'Journal', value: 'journal' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        step: 1,
        description:
          'Display order within the group: 1 shows first, 2 second, etc. Categories without a value come last, sorted by name.',
      },
    },
  ],
  timestamps: true,
}
