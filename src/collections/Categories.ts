import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { mcpCannotTrash } from '@/hooks/mcpWritesAreDrafts'
import { prependToOrder } from '@/hooks/prependToOrder'
import { readUntrashedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Categories: CollectionConfig = {
  slug: 'categories',
  trash: true,
  labels: {
    singular: 'Catégorie',
    plural: 'Catégories',
  },
  admin: {
    group: adminGroups.taxonomy,
    description:
      'Catégories partagées par les compétences, les technologies, les projets et le journal. Regroupées par domaine pour que chaque collection ne propose que les catégories qui la concernent. Glissez-déposez les lignes pour choisir leur ordre sur le site, au sein de chaque groupe.',
    defaultColumns: ['name', 'group'],
    useAsTitle: 'name',
  },
  orderable: true,
  access: {
    read: readUntrashedOrAuthenticated,
  },
  hooks: {
    beforeOperation: [mcpCannotTrash],
    beforeChange: [prependToOrder],
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      maxLength: 40,
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
  ],
  timestamps: true,
}
