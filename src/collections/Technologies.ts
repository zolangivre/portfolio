import type { CollectionConfig } from 'payload'

import { invertLogoInDarkModeField } from '@/fields/shared'
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'
import { isValidHexColor } from '@/lib/color'

export const Technologies: CollectionConfig = {
  slug: 'technologies',
  labels: {
    singular: 'Technologie',
    plural: 'Technologies',
  },
  admin: {
    group: adminGroups.taxonomy,
    description: 'Étiquettes de technologies utilisées par les projets et les expériences.',
    defaultColumns: ['logo', 'name', 'category', 'color'],
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
      name: 'slug',
      type: 'text',
      label: 'Identifiant (slug)',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
    },
    invertLogoInDarkModeField(),
    {
      name: 'website',
      type: 'text',
      label: 'Site web',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Couleur',
      admin: {
        description:
          'Couleur hexadécimale facultative, affichée en petit point sur les puces de technologies, par exemple #4287F5 (le # est ajouté automatiquement s’il manque).',
        components: {
          Cell: '/components/admin/TechColorSwatchCell#TechColorSwatchCell',
        },
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value !== 'string') return value
            const trimmed = value.trim()
            if (!trimmed) return null
            return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
          },
        ],
      },
      validate: (value: string | null | undefined) => {
        if (value == null || value === '') return true
        return (
          isValidHexColor(value) ||
          'Saisissez une couleur hexadécimale comme #4287F5 (3, 4, 6 ou 8 chiffres hexadécimaux).'
        )
      },
    },
    {
      name: 'category',
      type: 'relationship',
      label: 'Catégorie',
      relationTo: 'categories',
      filterOptions: {
        group: { equals: 'tech' },
      },
    },
  ],
  timestamps: true,
}
