import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: 'Témoignage',
    plural: 'Témoignages',
  },
  admin: {
    group: adminGroups.content,
    description: 'Citations de clients et de collègues affichées dans la section témoignages.',
    defaultColumns: ['avatar', 'author', 'company', 'featured', 'updatedAt'],
    useAsTitle: 'author',
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
      name: 'author',
      type: 'text',
      label: 'Auteur',
      required: true,
      admin: {
        description: 'Nom complet de la personne qui témoigne.',
      },
    },
    {
      name: 'role',
      type: 'text',
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
    {
      name: 'order',
      type: 'number',
      label: 'Ordre',
      defaultValue: 0,
      admin: {
        step: 1,
      },
    },
  ],
  timestamps: true,
}
