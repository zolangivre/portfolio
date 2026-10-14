import type { GlobalConfig } from 'payload'

import { revalidateGlobalAfterChange } from '@/hooks/revalidateSite'
import { adminGroups } from '@/lib/adminLabels'

import { palette } from '../lib/theme/palette'

const colorOptions = palette.map((color) => ({ label: color.label, value: color.key }))

export const GlobalSettings: GlobalConfig = {
  slug: 'settings',
  label: 'Réglages généraux',
  admin: {
    group: adminGroups.site,
    description:
      'Identité, image de marque, contact, thème et SEO par défaut, utilisés sur tout le site.',
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
      label: 'Nom',
      required: true,
      defaultValue: 'Alex Porter',
    },
    {
      name: 'profession',
      type: 'text',
      label: 'Métier',
      localized: true,
      defaultValue: 'Full-stack developer',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo de profil',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo du site',
    },
    {
      name: 'theme',
      type: 'group',
      label: 'Thème',
      admin: {
        description:
          'Définit la couleur utilisée pour les boutons, les liens, les badges, les états de focus et les accents sur tout le site.',
      },
      fields: [
        {
          name: 'primaryColor',
          type: 'select',
          label: 'Couleur principale',
          required: true,
          defaultValue: 'orange',
          options: colorOptions,
          admin: {
            description: 'La couleur d’accent principale, utilisée partout sur le site.',
            components: {
              Field: '/components/admin/ColorSwatchSelect#ColorSwatchSelect',
            },
          },
        },
        {
          name: 'accentColor',
          type: 'select',
          label: 'Couleur secondaire (facultative)',
          options: colorOptions,
          admin: {
            description:
              'Couleur secondaire facultative, pour un léger dégradé bicolore en arrière-plan. Si elle est vide, la couleur principale est utilisée.',
            components: {
              Field: '/components/admin/ColorSwatchSelect#ColorSwatchSelect',
            },
          },
        },
        {
          name: 'defaultTheme',
          type: 'select',
          label: 'Thème par défaut',
          defaultValue: 'system',
          options: [
            { label: 'Clair', value: 'light' },
            { label: 'Sombre', value: 'dark' },
            { label: 'Suivre le système', value: 'system' },
          ],
        },
        {
          name: 'cursorEffect',
          type: 'select',
          label: 'Effet de curseur',
          defaultValue: 'ring',
          options: [
            {
              label: 'Anneau (point + anneau qui suit)',
              value: 'ring',
            },
            {
              label: 'Traînée (comète de points qui s’estompent)',
              value: 'trail',
            },
          ],
          admin: {
            description:
              'Curseur personnalisé affiché sur ordinateur. Automatiquement désactivé sur les écrans tactiles et pour les personnes qui préfèrent réduire les animations.',
          },
        },
        {
          name: 'backgroundStyle',
          type: 'select',
          label: 'Fond du site',
          defaultValue: 'gradient',
          options: [
            {
              label: 'Lueurs colorées (lumineuses en haut de page, une teinte par section)',
              value: 'gradient',
            },
            {
              label: 'Photos floutées (vos photos en fond, une par section)',
              value: 'photo',
            },
            {
              label: 'Formes en verre en profondeur (parallaxe au défilement)',
              value: 'spatial',
            },
            {
              label: 'Formes à manipuler en haut de page (à pousser et lancer)',
              value: 'playground',
            },
            {
              label: 'Lumière selon l’heure du visiteur (aube, jour, soir, nuit)',
              value: 'daylight',
            },
            {
              label: 'Aplats de couleur par section',
              value: 'colorBlocks',
            },
          ],
          admin: {
            description:
              'L’arrière-plan de toutes les pages. Les couleurs suivent la couleur principale et la couleur secondaire. Les animations sont automatiquement réduites pour les personnes qui le demandent.',
          },
        },
        {
          name: 'backgroundPhotos',
          type: 'array',
          label: 'Photos du fond',
          labels: { plural: 'Photos', singular: 'Photo' },
          admin: {
            condition: (_, siblingData) => siblingData?.backgroundStyle === 'photo',
            description:
              'Utilisées dans l’ordre : la première derrière le haut de page, puis une par section (la liste recommence si elle est plus courte que la page). Elles sont fortement floutées, donc une image de 1600px de large suffit.',
          },
          fields: [
            {
              name: 'photo',
              type: 'upload',
              relationTo: 'media',
              label: 'Photo',
            },
          ],
        },
      ],
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'E-mail de contact',
      defaultValue: 'hello@yourdomain.com',
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Réseaux sociaux',
      labels: {
        singular: 'Réseau social',
        plural: 'Réseaux sociaux',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Plateforme',
          required: true,
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X / Twitter', value: 'x' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Dribbble', value: 'dribbble' },
            { label: 'Autre', value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'Lien',
          required: true,
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Icône',
          required: false,
          admin: {
            description:
              'Icône personnalisée facultative. Si elle est vide, l’icône intégrée de la plateforme choisie est utilisée.',
          },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO par défaut',
      admin: {
        description: 'Métadonnées de secours, utilisées quand une page ne définit pas les siennes.',
      },
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          label: 'Titre par défaut',
          defaultValue: 'Developer Portfolio',
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          label: 'Description par défaut',
          localized: true,
          defaultValue: 'Professional developer portfolio powered by Payload CMS and Next.js.',
        },
        {
          name: 'defaultImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Image OG par défaut',
        },
      ],
    },
  ],
}
