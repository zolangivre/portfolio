import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: 'Site',
    description: 'Primary header navigation links.',
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
      name: 'items',
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
          admin: {
            placeholder: '#projects',
          },
        },
      ],
      defaultValue: [
        { label: 'Projects', href: '#projects' },
        { label: 'Experience', href: '#experience' },
        { label: 'Skills', href: '#skills' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ],
    },
  ],
}
