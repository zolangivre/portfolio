import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'
import { textToLexicalParagraphs } from '@/lib/richText'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'À propos',
  admin: {
    group: adminGroups.content,
    description: 'La section « à propos » de la page d’accueil.',
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
      label: 'Surtitre',
      localized: true,
      defaultValue: 'About',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      required: true,
      localized: true,
      defaultValue: 'Designing thoughtful products with engineering depth.',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
      defaultValue: textToLexicalParagraphs(
        'A product-minded engineer focused on building fast, reliable experiences from concept to launch.',
      ),
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Corps de texte',
      localized: true,
    },
    {
      name: 'pointGroups',
      type: 'array',
      label: 'Groupes de points',
      labels: {
        singular: 'Groupe de points',
        plural: 'Groupes de points',
      },
      localized: true,
      admin: {
        description:
          'Listes titrées affichées à côté du portrait — par exemple Soft skills, Centres d’intérêt, Voyages, Parcours sportif.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Contenu',
        },
      ],
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      label: 'Portrait',
    },
  ],
}
