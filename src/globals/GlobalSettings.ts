import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'

import { palette } from '../lib/theme/palette'

const colorOptions = palette.map((color) => ({ label: color.label, value: color.key }))

export const GlobalSettings: GlobalConfig = {
  slug: 'settings',
  label: 'Global settings',
  admin: {
    group: 'Site',
    description: 'Identity, branding, contact, theme and default SEO used across the whole site.',
  },
  // Versioned like the content collections: edits autosave as a draft and only
  // reach the site once published, so the homepage can't change mid-edit.
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    max: 20,
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      defaultValue: 'Alex Porter',
    },
    {
      name: 'profession',
      type: 'text',
      label: 'Profession',
      localized: true,
      defaultValue: 'Full-stack developer',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile photo',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Site logo',
    },
    {
      name: 'theme',
      type: 'group',
      label: 'Theme',
      admin: {
        description:
          'Controls the color used for buttons, links, badges, focus states and accents across the whole site.',
      },
      fields: [
        {
          name: 'primaryColor',
          type: 'select',
          label: 'Primary color',
          required: true,
          defaultValue: 'orange',
          options: colorOptions,
          admin: {
            description: 'The main accent color, used everywhere across the site.',
            components: {
              Field: '/components/admin/ColorSwatchSelect#ColorSwatchSelect',
            },
          },
        },
        {
          name: 'accentColor',
          type: 'select',
          label: 'Accent color (optional)',
          options: colorOptions,
          admin: {
            description:
              'Optional secondary color for a subtle two-tone highlight in the background. Falls back to the primary color when left empty.',
            components: {
              Field: '/components/admin/ColorSwatchSelect#ColorSwatchSelect',
            },
          },
        },
        {
          name: 'defaultTheme',
          type: 'select',
          label: 'Default theme',
          defaultValue: 'system',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Follow system', value: 'system' },
          ],
        },
        {
          name: 'cursorEffect',
          type: 'select',
          label: 'Cursor effect',
          defaultValue: 'ring',
          options: [
            { label: 'Ring (dot + trailing ring)', value: 'ring' },
            { label: 'Trail (comet of fading dots)', value: 'trail' },
          ],
          admin: {
            description:
              'Custom cursor shown on desktop. Automatically disabled on touch devices and for users who prefer reduced motion.',
          },
        },
      ],
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Contact email',
      defaultValue: 'hello@yourdomain.com',
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social links',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X / Twitter', value: 'x' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Dribbble', value: 'dribbble' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: {
            description:
              'Optional custom icon. Falls back to a built-in icon for the selected platform when left empty.',
          },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Default SEO',
      admin: {
        description: 'Fallback metadata used when a page does not define its own.',
      },
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          label: 'Default title',
          defaultValue: 'Developer Portfolio',
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          label: 'Default description',
          localized: true,
          defaultValue: 'Professional developer portfolio powered by Payload CMS and Next.js.',
        },
        {
          name: 'defaultImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default OG image',
        },
      ],
    },
  ],
}
