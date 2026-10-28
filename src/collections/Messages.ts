import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { notifyNewMessage } from '@/hooks/notifyNewMessage'
import { adminGroups } from '@/lib/adminLabels'

/**
 * `create` is public (the contact form), and trash adds a `deletedAt` field
 * any caller could set: a message created straight into the trash would
 * still send its notification, yet never show in the inbox. Only an editor
 * decides what goes to the trash.
 */
const ignoreDeletedAtFromVisitors: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && !req.user) {
    delete data.deletedAt
  }

  return data
}

export const Messages: CollectionConfig = {
  slug: 'messages',
  trash: true,
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
  hooks: {
    beforeChange: [ignoreDeletedAtFromVisitors],
    afterChange: [notifyNewMessage],
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // Lengths are capped here as well as on the form: the server action is a
    // public endpoint, so the browser's `maxLength` is a convenience, not a
    // control.
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
      maxLength: 120,
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-mail',
      required: true,
      // `email` fields take no maxLength, so the cap goes through validate.
      // 254 is the maximum length of an address per RFC 5321.
      validate: (value: string | null | undefined) =>
        !value || value.length <= 254 || 'L’adresse e-mail est trop longue.',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      maxLength: 5000,
    },
    {
      name: 'read',
      type: 'checkbox',
      label: 'Lu',
      defaultValue: false,
      index: true,
      access: {
        // Anyone may create a message, but only an editor decides it has been
        // read — otherwise a script posting to /api/messages could file its
        // spam as already seen, out of sight of the unread list.
        create: ({ req }) => Boolean(req.user),
      },
    },
  ],
  timestamps: true,
}
