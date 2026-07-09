import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials',
  },
  admin: {
    group: 'Content',
    description: 'Client and colleague quotes displayed in the testimonials section.',
    defaultColumns: ['avatar', 'author', 'company', 'featured', 'updatedAt'],
    useAsTitle: 'author',
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
      name: 'author',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the person giving the testimonial.',
      },
    },
    {
      name: 'role',
      type: 'text',
      admin: {
        description: 'Job title, e.g. "Product Manager".',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
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
      defaultValue: 0,
      admin: {
        step: 1,
      },
    },
  ],
  timestamps: true,
}
