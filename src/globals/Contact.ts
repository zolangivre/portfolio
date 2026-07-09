import type { GlobalConfig } from 'payload'

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
  fields: [
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
      type: 'textarea',
      label: 'Description',
      localized: true,
      defaultValue:
        'Available for select freelance work, product collaborations, and full-stack product builds.',
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
