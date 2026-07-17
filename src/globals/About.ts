import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'About',
  admin: {
    group: 'Content',
    description: 'The homepage about section.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow',
      localized: true,
      defaultValue: 'About',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
      defaultValue: 'Designing thoughtful products with engineering depth.',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      localized: true,
      defaultValue:
        'A product-minded engineer focused on building fast, reliable experiences from concept to launch.',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Body',
      localized: true,
    },
    {
      name: 'pointGroups',
      type: 'array',
      label: 'Point groups',
      labels: {
        singular: 'Point group',
        plural: 'Point groups',
      },
      localized: true,
      admin: {
        description:
          'Titled lists shown next to the portrait — e.g. Soft skills, Interests, Travels, Sports background.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content',
        },
      ],
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      label: 'Portrait',
    },
  ],
}
