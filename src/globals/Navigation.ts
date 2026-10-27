import type { GlobalConfig } from 'payload'

import { draftVersions, GLOBAL_SCHEDULE_HINT, hideUnpublishButton } from '@/collections/drafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { readPublishedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: adminGroups.site,
    description: 'Liens de navigation principaux, dans l’en-tête.' + GLOBAL_SCHEDULE_HINT,
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
      name: 'items',
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
