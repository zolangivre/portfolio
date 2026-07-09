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
      type: 'textarea',
      label: 'Description',
      localized: true,
      defaultValue:
        'I design and ship fast, reliable experiences for ambitious teams — from product strategy to production-ready code.',
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
  ],
}
