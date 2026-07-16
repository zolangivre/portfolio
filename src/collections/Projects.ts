import type { CollectionConfig } from 'payload'

import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    group: 'Portfolio',
    description: 'Portfolio projects shown in the projects section.',
    defaultColumns: [
      'coverImage',
      'title',
      'status',
      'technologies',
      'category',
      'featured',
      'order',
      'year',
    ],
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
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverImageDark',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional dark-mode variant of the cover image. Shown instead of the cover image when the site is in dark mode.',
      },
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'technologies',
      type: 'relationship',
      relationTo: 'technologies',
      hasMany: true,
    },
    {
      name: 'githubUrl',
      type: 'text',
      admin: {
        placeholder: 'https://github.com/username/project',
      },
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        placeholder: 'https://example.com',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        step: 1,
        description:
          'Display order: 1 shows first, 2 second, etc. Leave empty to fall back to newest-first after ordered projects.',
      },
    },
    {
      name: 'year',
      type: 'number',
      admin: {
        step: 1,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'live',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: {
        group: { equals: 'project' },
      },
    },
  ],
  timestamps: true,
}
