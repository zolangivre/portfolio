import type { CollectionConfig } from 'payload'

import { orderField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Education: CollectionConfig = {
  slug: 'education',
  labels: {
    singular: 'Formation',
    plural: 'Formations',
  },
  admin: {
    group: adminGroups.portfolio,
    description: 'Entrées de la frise des formations.',
    defaultColumns: ['school', 'location', 'degree', 'startDate', 'endDate', 'order'],
    useAsTitle: 'degree',
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
      name: 'school',
      type: 'relationship',
      label: 'École',
      relationTo: 'schools',
      required: true,
      admin: {
        components: {
          Cell: '/components/admin/RelatedLogoCell#SchoolLogoCell',
        },
      },
    },
    {
      name: 'degree',
      type: 'text',
      label: 'Diplôme',
      required: true,
      localized: true,
    },
    {
      name: 'fieldOfStudy',
      type: 'text',
      label: 'Domaine d’études',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
    },
    {
      name: 'location',
      type: 'text',
      label: 'Lieu',
      localized: true,
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Date de début',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Date de fin',
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'currentlyStudying',
      type: 'checkbox',
      label: 'Formation en cours',
      defaultValue: false,
    },
    orderField(
      'l’entrée après celles qui sont ordonnées, de la date de début la plus récente à la plus ancienne',
    ),
  ],
  timestamps: true,
}
