import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Site',
    description: 'Footer text and links.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Footer text',
      localized: true,
      defaultValue: 'Crafted for ambitious products, polished interfaces, and reliable engineering.',
    },
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
      ],
      defaultValue: [{ label: 'Open admin', href: '/admin' }],
    },
  ],
}
