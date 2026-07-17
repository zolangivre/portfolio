import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { textToLexicalParagraphs } from '@/lib/richText'

export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact',
  admin: {
    group: 'Content',
    description: 'The homepage contact section.',
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
      defaultValue: 'Contact',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
      defaultValue: 'Let’s build something meaningful.',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
      defaultValue: textToLexicalParagraphs(
        'Available for select freelance work, product collaborations, and full-stack product builds.',
      ),
    },
    {
      name: 'successMessage',
      type: 'text',
      label: 'Success message',
      localized: true,
      defaultValue: 'Thanks for reaching out — I’ll get back to you shortly.',
    },
  ],
}
