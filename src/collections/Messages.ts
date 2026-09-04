import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/lib/adminLabels'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: {
    singular: 'Message',
    plural: 'Messages',
  },
  admin: {
    group: adminGroups.contact,
    description: 'Messages envoyés depuis le formulaire de contact du site.',
    defaultColumns: ['name', 'email', 'read', 'createdAt'],
    useAsTitle: 'name',
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-mail',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
    },
    {
      name: 'read',
      type: 'checkbox',
      label: 'Lu',
      defaultValue: false,
      index: true,
    },
  ],
  timestamps: true,
}
