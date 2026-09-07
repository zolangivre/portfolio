import type { Field } from 'payload'

/**
 * Shared labels for the admin panel. The panel runs in French only (see
 * `i18n` in payload.config.ts), which is separate from the site's content
 * locales — those translate the *values* editors type in, not the chrome
 * around them.
 *
 * Most labels live inline next to their field. What lands here is what has to
 * be byte-identical across files, or what this repo doesn't declare itself.
 */

/**
 * Labels for the groups Payload uses to bucket collections and globals in the
 * admin sidebar. Shared so every entity in the same group is labelled
 * identically — Payload buckets by the rendered label, so two spellings would
 * split one group into two sections.
 */
export const adminGroups = {
  contact: 'Contact',
  content: 'Contenu',
  journal: 'Journal',
  portfolio: 'Portfolio',
  site: 'Site',
  taxonomy: 'Taxonomie',
} as const

/**
 * The site's sections, named once. The visibility toggles and the section
 * intro copy both key off these, so the two screens can't drift apart.
 */
export const sectionLabels = {
  about: 'À propos',
  contact: 'Contact',
  education: 'Formations',
  experience: 'Expériences',
  hero: 'Bannière',
  journal: 'Journal',
  projects: 'Projets',
  skills: 'Compétences',
  testimonials: 'Témoignages',
} as const

/**
 * The SEO plugin hardcodes its field labels in English — its own
 * `plugin-seo:*` translations only cover what its custom components render,
 * like the character counter — so the SEO tab would otherwise be the one
 * English island left in the panel. Applied through the plugin's `fields`
 * override, which is the only seam that reaches them: the field factories
 * apply `overrides` as a shallow spread, so overriding `admin` there would
 * drop the custom components the plugin puts in `admin.components`.
 */
const seoLabels: Record<string, string> = {
  description: 'Description meta',
  image: 'Image meta',
  overview: 'Vue d’ensemble',
  preview: 'Aperçu',
  title: 'Titre meta',
}

export function translateSeoFields({ defaultFields }: { defaultFields: Field[] }): Field[] {
  for (const field of defaultFields) {
    if (!('name' in field)) continue

    const label = seoLabels[field.name]
    if (label) field.label = label

    if (field.name === 'image') {
      field.admin = {
        ...field.admin,
        description: 'Taille maximale : 12 Mo. Idéalement moins de 500 Ko par image.',
      }
    }
  }

  return defaultFields
}
