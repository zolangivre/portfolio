import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Site',
    description: 'Footer text and links.',
  },
  // Versioned like the content collections: edits autosave as a draft and only
  // reach the site once published, so the homepage can't change mid-edit.
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    max: 20,
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
