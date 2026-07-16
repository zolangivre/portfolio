import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'
import { isValidHexColor } from '@/lib/color'

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
        description:
          'Optional hex color shown as a small dot on the tech chips, e.g. #4287F5 (the # is added automatically if missing).',
        components: {
          Cell: '/components/admin/TechColorSwatchCell#TechColorSwatchCell',
        },
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value !== 'string') return value
            const trimmed = value.trim()
            if (!trimmed) return null
            return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
          },
        ],
      },
      validate: (value: string | null | undefined) => {
        if (value == null || value === '') return true
        return (
          isValidHexColor(value) || 'Enter a hex color like #4287F5 (3, 4, 6 or 8 hex digits).'
        )
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
