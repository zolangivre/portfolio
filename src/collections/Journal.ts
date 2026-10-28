import type { CollectionConfig } from 'payload'

import { mcpWritesAreDrafts } from '@/hooks/mcpWritesAreDrafts'
import { prependToOrder, syncDraftOrder } from '@/hooks/prependToOrder'
import {
  rememberLiveState,
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { readPublishedUntrashedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

import { draftVersions, SCHEDULE_HINT } from './drafts'

export const Journal: CollectionConfig = {
  slug: 'journal',
  trash: true,
  labels: {
    singular: 'Entrée de journal',
    plural: 'Journal',
  },
  admin: {
    groupBy: true,
    group: adminGroups.journal,
    description:
      'Récits personnels, hors technique : voyages, sport, réussites, événements, découvertes. Glissez-déposez les lignes pour choisir leur ordre sur le site.' +
      SCHEDULE_HINT,
    defaultColumns: ['coverImage', 'title', 'category', '_status', 'date', 'featured'],
    useAsTitle: 'title',
  },
  orderable: true,
  versions: draftVersions(),
  access: {
    read: readPublishedUntrashedOrAuthenticated,
  },
  hooks: {
    beforeOperation: [mcpWritesAreDrafts],
    beforeChange: [prependToOrder, rememberLiveState],
    afterChange: [syncDraftOrder, revalidateCollectionAfterChange],
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
  ],
  timestamps: true,
}
