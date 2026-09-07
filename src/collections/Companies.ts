import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

export const Companies: CollectionConfig = {
  slug: 'companies',
  labels: {
    singular: 'Entreprise',
    plural: 'Entreprises',
  },
  admin: {
    group: adminGroups.taxonomy,
    description: 'Entreprises référencées par les expériences professionnelles.',
    defaultColumns: ['logo', 'name', 'location', 'updatedAt'],
    useAsTitle: 'name',
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
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Site web',
    },
    {
      name: 'location',
      type: 'text',
      label: 'Lieu',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      localized: true,
    },
  ],
  timestamps: true,
}
