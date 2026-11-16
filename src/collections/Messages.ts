import type { CollectionBeforeChangeHook, CollectionConfig, EmailFieldValidation } from 'payload'

import { notifyNewMessage } from '@/hooks/notifyNewMessage'
import { adminGroups } from '@/lib/adminLabels'
import { EMAIL_PATTERN } from '@/lib/contactValidation'
import { neutralizeFormula } from '@/lib/csv'

/**
 * `create` is public (the contact form), so a visitor's request body may
 * carry fields the form never sends. Two kinds are dropped:
 * - `deletedAt`, from trash: a message created straight into the trash would
 *   still send its notification, yet never show in the inbox. Only an editor
 *   decides what goes to the trash.
 * - the timestamps: the inbox and the dashboard's unread widget sort by
 *   `createdAt`, so a message dated 9999 would sit on top for good, and five
 *   of them would push every real message out of the widget. Only the server
 *   dates a message.
 */
export const ignoreInboxStateFromVisitors: CollectionBeforeChangeHook = ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create' && !req.user) {
    delete data.deletedAt
    delete data.createdAt
    delete data.updatedAt
  }

  return data
}

/**
 * A custom `validate` replaces Payload's own email validation instead of
 * adding to it, so the address check and the required check live here too.
 * Without them the REST endpoint, which skips the contact form's server
 * action, stored an empty or malformed address and used it as the
 * notification's reply-to.
 *
 * The format is only checked on create: an editor marking an older message as
 * read re-validates the whole document, and shouldn't be stopped by an address
 * a visitor typed before this check existed.
 */
export const validateMessageEmail: EmailFieldValidation = (value, { operation }) => {
  if (value && value.length > 254) {
    return 'L’adresse e-mail est trop longue.'
  }

  if (operation !== 'create') {
    return true
  }

  if (!value) {
    return 'L’adresse e-mail est requise.'
  }

  return EMAIL_PATTERN.test(value) || 'L’adresse e-mail est invalide.'
}

/** On each field a visitor fills in. JSON exports keep the exact text. */
const safeInCSV = {
  'plugin-import-export': {
    toCSV: ({ value }: { value: unknown }) => neutralizeFormula(value),
  },
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
    // A message is never something rich text may point at: a reference would
    // fill in the visitor's name, email and message wherever it's read.
    enableRichTextLink: false,
    enableRichTextRelationship: false,
  },
  hooks: {
    beforeChange: [ignoreInboxStateFromVisitors],
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
      custom: safeInCSV,
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-mail',
      required: true,
      // `email` fields take no maxLength, so the cap goes through validate.
      // 254 is the maximum length of an address per RFC 5321.
      validate: validateMessageEmail,
      custom: safeInCSV,
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      maxLength: 5000,
      custom: safeInCSV,
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
