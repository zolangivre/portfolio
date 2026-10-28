import type { GlobalConfig } from 'payload'

import { draftVersions, GLOBAL_SCHEDULE_HINT, hideUnpublishButton } from '@/collections/drafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { readPublishedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'
import { textToLexicalParagraphs } from '@/lib/richText'

export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact',
  admin: {
    group: adminGroups.content,
    description: 'La section contact de la page d’accueil.' + GLOBAL_SCHEDULE_HINT,
    components: hideUnpublishButton(),
  },
  versions: draftVersions(),
  access: {
    read: readPublishedOrAuthenticated,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Surtitre',
      localized: true,
      defaultValue: 'Contact',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
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
      label: 'Message de confirmation',
      localized: true,
      defaultValue: 'Thanks for reaching out — I’ll get back to you shortly.',
    },
  ],
}
