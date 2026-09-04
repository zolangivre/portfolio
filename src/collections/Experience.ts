import type { CollectionConfig } from 'payload'

import { orderField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  labels: {
    singular: 'Expérience',
    plural: 'Expériences',
  },
  admin: {
    group: adminGroups.portfolio,
    description: 'Entrées de la frise des expériences professionnelles.',
    defaultColumns: ['company', 'location', 'position', 'startDate', 'endDate', 'order'],
    useAsTitle: 'position',
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
      name: 'company',
      type: 'relationship',
      label: 'Entreprise',
      relationTo: 'companies',
      required: true,
      admin: {
        components: {
          Cell: '/components/admin/RelatedLogoCell#CompanyLogoCell',
        },
      },
    },
    {
      name: 'position',
      type: 'text',
      label: 'Poste',
      required: true,
      localized: true,
    },
    {
      name: 'employmentType',
      type: 'text',
      label: 'Type de contrat',
      localized: true,
    },
    {
      name: 'location',
      type: 'text',
      label: 'Lieu',
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
      name: 'technologies',
      type: 'relationship',
      label: 'Technologies',
      relationTo: 'technologies',
      hasMany: true,
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
      name: 'currentlyWorking',
      type: 'checkbox',
      label: 'Poste en cours',
      defaultValue: false,
    },
    orderField(
      'l’entrée après celles qui sont ordonnées, de la date de début la plus récente à la plus ancienne',
    ),
  ],
  timestamps: true,
}
