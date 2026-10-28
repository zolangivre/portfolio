import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { mcpCannotTrash } from '@/hooks/mcpWritesAreDrafts'
import { prependToOrder } from '@/hooks/prependToOrder'
import { readUntrashedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  trash: true,
  labels: {
    singular: 'Témoignage',
    plural: 'Témoignages',
  },
  admin: {
    group: adminGroups.content,
    description:
      'Citations de clients et de collègues affichées dans la section témoignages. Glissez-déposez les lignes pour choisir leur ordre sur le site.',
    defaultColumns: ['avatar', 'author', 'company', 'featured', 'updatedAt'],
    useAsTitle: 'author',
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
      name: 'author',
      type: 'text',
      maxLength: 60,
      label: 'Auteur',
      required: true,
      admin: {
        description: 'Nom complet de la personne qui témoigne.',
      },
    },
    {
      name: 'role',
      type: 'text',
      maxLength: 80,
      label: 'Poste',
      admin: {
        description: 'Intitulé du poste, par exemple « Product Manager ».',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      label: 'Entreprise',
      relationTo: 'companies',
    },
    {
      name: 'avatar',
      type: 'upload',
      label: 'Photo',
      relationTo: 'media',
    },
    {
      name: 'quote',
      type: 'textarea',
      maxLength: 800,
      label: 'Témoignage',
      required: true,
      localized: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mis en avant',
      defaultValue: false,
      index: true,
    },
  ],
  timestamps: true,
}
