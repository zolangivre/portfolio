import type { CollectionConfig } from 'payload'

import { invertLogoInDarkModeField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Skills: CollectionConfig = {
  slug: 'skills',
  labels: {
    singular: 'Compétence',
    plural: 'Compétences',
  },
  admin: {
    group: adminGroups.taxonomy,
    description: 'Compétences regroupées par catégorie, affichées dans la section compétences.',
    defaultColumns: ['logo', 'name', 'category', 'url'],
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      label: 'Catégorie',
      relationTo: 'categories',
      required: true,
      filterOptions: {
        group: { equals: 'tech' },
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Lien',
      admin: {
        description:
          'Lien facultatif vers la documentation ou le site officiel. Rend toute la carte cliquable.',
      },
      validate: (value: string | null | undefined) => {
        if (value == null || value === '') return true
        try {
          new URL(value)
          return true
        } catch {
          return 'Saisissez une URL valide, protocole inclus (par exemple https://exemple.com).'
        }
      },
    },
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
    },
    invertLogoInDarkModeField(),
  ],
  timestamps: true,
}
