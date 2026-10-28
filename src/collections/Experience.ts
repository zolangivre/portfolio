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

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  trash: true,
  labels: {
    singular: 'Expérience',
    plural: 'Expériences',
  },
  admin: {
    group: adminGroups.portfolio,
    description:
      'Entrées de la frise des expériences professionnelles. Glissez-déposez les lignes pour choisir leur ordre sur le site.' +
      SCHEDULE_HINT,
    defaultColumns: ['company', 'location', 'position', 'startDate', 'endDate', '_status'],
    useAsTitle: 'position',
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
      maxLength: 100,
      label: 'Poste',
      required: true,
      localized: true,
    },
    {
      name: 'employmentType',
      type: 'text',
      maxLength: 40,
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
  ],
  timestamps: true,
}
