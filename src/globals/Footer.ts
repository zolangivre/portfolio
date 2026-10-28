import type { GlobalConfig } from 'payload'

import { draftVersions, GLOBAL_SCHEDULE_HINT, hideUnpublishButton } from '@/collections/drafts'
import { mcpGlobalWritesAreDrafts } from '@/hooks/mcpWritesAreDrafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { readPublishedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Pied de page',
  admin: {
    group: adminGroups.site,
    description: 'Texte et liens du pied de page.' + GLOBAL_SCHEDULE_HINT,
    components: hideUnpublishButton(),
  },
  versions: draftVersions(),
  access: {
    read: readPublishedOrAuthenticated,
  },
  hooks: {
    beforeOperation: [mcpGlobalWritesAreDrafts],
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Texte du pied de page',
      localized: true,
      defaultValue:
        'Crafted for ambitious products, polished interfaces, and reliable engineering.',
    },
    {
      name: 'links',
      type: 'array',
      label: 'Liens',
      labels: {
        singular: 'Lien',
        plural: 'Liens',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Libellé',
          required: true,
          localized: true,
        },
        {
          name: 'href',
          type: 'text',
          label: 'Lien',
          required: true,
        },
      ],
      defaultValue: [{ label: 'Open admin', href: '/admin' }],
    },
  ],
}
