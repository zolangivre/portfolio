import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Pied de page',
  admin: {
    group: adminGroups.site,
    description: 'Texte et liens du pied de page.',
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
