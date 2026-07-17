import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  labels: {
    singular: 'Experience',
    plural: 'Experiences',
  },
  admin: {
    group: 'Portfolio',
    description: 'Professional experience timeline entries.',
    defaultColumns: ['company', 'location', 'position', 'startDate', 'endDate', 'order'],
    useAsTitle: 'position',
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
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        components: {
          Cell: '/components/admin/RelatedLogoCell#CompanyLogoCell',
        },
      },
    },
    {
      name: 'position',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'employmentType',
      type: 'text',
      localized: true,
    },
    {
      name: 'location',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'technologies',
      type: 'relationship',
      relationTo: 'technologies',
      hasMany: true,
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
      name: 'currentlyWorking',
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
