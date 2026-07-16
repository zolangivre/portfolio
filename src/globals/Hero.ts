import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

export const Hero: GlobalConfig = {
  slug: 'hero',
  label: 'Hero',
  admin: {
    group: 'Content',
    description: 'The homepage hero section.',
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
      label: 'Eyebrow / role',
      localized: true,
      defaultValue: 'Full-stack developer',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
      defaultValue: 'Building polished digital products with calm, modern engineering.',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'Highlights',
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
      name: 'primaryCta',
      type: 'group',
      label: 'Primary call to action',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'View projects',
        },
        {
          name: 'href',
          type: 'text',
          defaultValue: '#projects',
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Secondary call to action',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Let’s talk',
        },
        {
          name: 'href',
          type: 'text',
          defaultValue: '#contact',
        },
      ],
    },
    {
      name: 'resumeCta',
      type: 'group',
      label: 'Resume / CV button',
      admin: {
        description:
          'Upload one file per language. The button only appears once a file is set for the current language, and links directly to it.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Download CV',
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          localized: true,
          label: 'CV file',
        },
      ],
    },
  ],
}
