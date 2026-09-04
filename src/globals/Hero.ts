import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Hero: GlobalConfig = {
  slug: 'hero',
  label: 'Bannière (hero)',
  admin: {
    group: adminGroups.content,
    description: 'La bannière d’accueil, en haut de la page d’accueil.',
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
      label: 'Surtitre / rôle',
      localized: true,
      defaultValue: 'Full-stack developer',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      required: true,
      localized: true,
      defaultValue: 'Building polished digital products with calm, modern engineering.',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'Points forts',
      labels: {
        singular: 'Point fort',
        plural: 'Points forts',
      },
      localized: true,
      fields: [
        {
          name: 'value',
          type: 'text',
          label: 'Texte',
          required: true,
        },
      ],
    },
    {
      name: 'primaryCta',
      type: 'group',
      label: 'Bouton d’action principal',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Libellé',
          localized: true,
          defaultValue: 'View projects',
        },
        {
          name: 'href',
          type: 'text',
          label: 'Lien',
          defaultValue: '#projects',
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Bouton d’action secondaire',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Libellé',
          localized: true,
          defaultValue: 'Let’s talk',
        },
        {
          name: 'href',
          type: 'text',
          label: 'Lien',
          defaultValue: '#contact',
        },
      ],
    },
    {
      name: 'resumeCta',
      type: 'group',
      label: 'Bouton CV',
      admin: {
        description:
          'Ajoutez un fichier par langue. Le bouton n’apparaît que lorsqu’un fichier est défini pour la langue affichée, et pointe directement dessus.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Libellé',
          localized: true,
          defaultValue: 'Download CV',
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          localized: true,
          label: 'Fichier CV',
        },
      ],
    },
  ],
}
