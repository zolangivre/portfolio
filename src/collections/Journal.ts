import type { CollectionConfig } from 'payload'

import { orderField, visibilityField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Journal: CollectionConfig = {
  slug: 'journal',
  labels: {
    singular: 'Entrée de journal',
    plural: 'Journal',
  },
  admin: {
    group: adminGroups.journal,
    description:
      'Récits personnels, hors technique : voyages, sport, réussites, événements, découvertes.',
    defaultColumns: ['coverImage', 'title', 'category', 'visibility', 'date', 'featured', 'order'],
    useAsTitle: 'title',
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
      name: 'title',
      type: 'text',
      label: 'Titre',
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
      name: 'category',
      type: 'relationship',
      label: 'Catégorie',
      relationTo: 'categories',
      required: true,
      filterOptions: {
        group: { equals: 'journal' },
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Description courte',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenu',
      required: true,
      localized: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      label: 'Image de couverture',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'relationship',
      label: 'Galerie',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'date',
      type: 'date',
      label: 'Date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Lieu',
      localized: true,
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Étiquettes',
      labels: {
        singular: 'Étiquette',
        plural: 'Étiquettes',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          label: 'Étiquette',
          required: true,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mis en avant',
      defaultValue: false,
      index: true,
    },
    visibilityField(
      'Les entrées privées restent dans le CMS mais ne sont jamais affichées sur le site.',
    ),
    orderField(
      'l’entrée après celles qui sont ordonnées, de la date la plus récente à la plus ancienne',
    ),
  ],
  timestamps: true,
}
