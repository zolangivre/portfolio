import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Education: CollectionConfig = {
  slug: 'education',
  admin: {
    group: 'Portfolio',
    description: 'Education timeline entries.',
    defaultColumns: ['school', 'location', 'degree', 'startDate', 'endDate', 'order'],
    useAsTitle: 'degree',
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
      name: 'school',
      type: 'relationship',
      relationTo: 'schools',
      required: true,
      admin: {
        components: {
          Cell: '/components/admin/RelatedLogoCell#SchoolLogoCell',
        },
      },
    },
    {
      name: 'degree',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'fieldOfStudy',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'location',
      type: 'text',
      localized: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'currentlyStudying',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        step: 1,
        description:
          'Display order: 1 shows first, 2 second, etc. Leave empty to fall back to most recent start date after ordered entries.',
      },
    },
  ],
  timestamps: true,
}
