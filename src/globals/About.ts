import type { GlobalConfig } from 'payload'

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
  fields: [
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
      name: 'points',
      type: 'array',
      label: 'Points',
      localized: true,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
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
