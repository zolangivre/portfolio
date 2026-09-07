import type { CollectionConfig } from 'payload'

import { orderField, visibilityField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { readPublicOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Projet',
    plural: 'Projets',
  },
  admin: {
    group: adminGroups.portfolio,
    description: 'Projets du portfolio affichés dans la section projets.',
    defaultColumns: [
      'coverImage',
      'title',
      'status',
      'technologies',
      'category',
      'visibility',
      'featured',
      'order',
      'year',
    ],
    useAsTitle: 'title',
  },
  defaultSort: 'order',
  access: {
    read: readPublicOrAuthenticated,
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
      name: 'shortDescription',
      type: 'textarea',
      label: 'Description courte',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
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
      name: 'coverImageDark',
      type: 'upload',
      label: 'Image de couverture (mode sombre)',
      relationTo: 'media',
      admin: {
        description:
          'Variante facultative de l’image de couverture pour le mode sombre. Elle remplace l’image de couverture quand le site est en mode sombre.',
      },
    },
    {
      name: 'gallery',
      type: 'relationship',
      label: 'Galerie',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'technologies',
      type: 'relationship',
      label: 'Technologies',
      relationTo: 'technologies',
      hasMany: true,
    },
    {
      name: 'githubUrl',
      type: 'text',
      label: 'Lien GitHub',
      admin: {
        placeholder: 'https://github.com/username/project',
      },
    },
    {
      name: 'liveUrl',
      type: 'text',
      label: 'Lien en ligne',
      admin: {
        placeholder: 'https://example.com',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Mis en avant',
      defaultValue: false,
      index: true,
    },
    visibilityField(
      'Les projets privés restent dans le CMS mais ne sont jamais affichés sur le site.',
    ),
    orderField('le projet après ceux qui sont ordonnés, du plus récent au plus ancien'),
    {
      name: 'year',
      type: 'number',
      label: 'Année',
      admin: {
        step: 1,
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Statut',
      options: [
        { label: 'En ligne', value: 'live' },
        { label: 'En cours', value: 'in-progress' },
        { label: 'Archivé', value: 'archived' },
      ],
      defaultValue: 'live',
    },
    {
      name: 'category',
      type: 'relationship',
      label: 'Catégorie',
      relationTo: 'categories',
      filterOptions: {
        group: { equals: 'project' },
      },
    },
  ],
  timestamps: true,
}
