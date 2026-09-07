import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Catégorie',
    plural: 'Catégories',
  },
  admin: {
    group: adminGroups.taxonomy,
    description:
      'Catégories partagées par les compétences, les technologies, les projets et le journal. Regroupées par domaine pour que chaque collection ne propose que les catégories qui la concernent.',
    defaultColumns: ['name', 'group', 'order'],
    useAsTitle: 'name',
  },
  defaultSort: 'order',
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
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Identifiant (slug)',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'group',
      type: 'select',
      label: 'Groupe',
      required: true,
      index: true,
      options: [
        {
          label: 'Tech (compétences et technologies)',
          value: 'tech',
        },
        { label: 'Projets', value: 'project' },
        { label: 'Journal', value: 'journal' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      label: 'Ordre',
      admin: {
        step: 1,
        description:
          'Ordre d’affichage au sein du groupe : 1 s’affiche en premier, 2 en deuxième, etc. Les catégories sans valeur passent en dernier, triées par nom.',
      },
    },
  ],
  timestamps: true,
}
