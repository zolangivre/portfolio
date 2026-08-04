import type { CollectionConfig } from 'payload'

import { publishedOnly } from '@/access/publishedOnly'
import { revalidateCollectionAfterChange, revalidateCollectionAfterDelete } from '@/hooks/revalidateSite'
import { buildPreviewURL } from '@/lib/preview'

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
      '_status',
      'featured',
      'order',
      'year',
    ],
    useAsTitle: 'title',
    // "Preview" button in the document header.
    preview: (data, { locale }) =>
      buildPreviewURL({ collection: 'projects', slug: data?.slug as string, locale }),
    // Side-by-side live preview while editing.
    livePreview: {
      url: ({ data, locale }) =>
        buildPreviewURL({ collection: 'projects', slug: data?.slug as string, locale: locale?.code }),
    },
  },
  defaultSort: 'order',
  // Replaces the old `visibility` field: a project is on the site once it's
  // published, and invisible while it's a draft.
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  access: {
    read: publishedOnly,
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
      // Enabling drafts injects Payload's own `_status` field, and Postgres
      // enum names are snake-cased with the leading underscore dropped — so
      // both fields would claim `enum_projects_status`. This keeps the
      // editorial status (live / in progress / archived) on its own type.
      enumName: 'enum_projects_project_status',
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
