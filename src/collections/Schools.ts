import type { CollectionConfig } from 'payload'

import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { readUntrashedOrAuthenticated } from '@/lib/access'
import { adminGroups } from '@/lib/adminLabels'

export const Schools: CollectionConfig = {
  slug: 'schools',
  trash: true,
  labels: {
    singular: 'École',
    plural: 'Écoles',
  },
  admin: {
    group: adminGroups.taxonomy,
    description: 'Écoles référencées par les entrées de formation.',
    defaultColumns: ['logo', 'name', 'location', 'updatedAt'],
    useAsTitle: 'name',
  },
  access: {
    read: readUntrashedOrAuthenticated,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      maxLength: 100,
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
