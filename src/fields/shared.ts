import type { CheckboxField, NumberField, SelectField } from 'payload'

/**
 * Field definitions used by more than one collection. Each is a factory rather
 * than a shared constant: Payload mutates field objects while sanitizing the
 * config, so two collections must not point at the same one.
 */

/** Logo tint toggle, on every collection that stores a logo. */
export const invertLogoInDarkModeField = (): CheckboxField => ({
  name: 'invertLogoInDarkMode',
  type: 'checkbox',
  label: 'Inverser le logo en mode sombre',
  defaultValue: false,
  admin: {
    description:
      'Inverse les couleurs du logo quand le site est en mode sombre. À activer pour les logos noirs ou foncés, afin qu’ils restent visibles sur le thème sombre.',
  },
})

/**
 * Public/private switch for the collections the site renders. The description
 * is passed in whole — French agreement makes a shared template read worse
 * than the two sentences it would replace.
 */
export const visibilityField = (description: string): SelectField => ({
  name: 'visibility',
  type: 'select',
  label: 'Visibilité',
  required: true,
  defaultValue: 'public',
  options: [
    { label: 'Public', value: 'public' },
    { label: 'Privé (masqué sur le site)', value: 'private' },
  ],
  admin: { description },
})

/**
 * Manual sort position. `fallback` completes "Laissez vide pour classer …",
 * naming what each collection falls back to once the ordered entries run out.
 */
export const orderField = (fallback: string): NumberField => ({
  name: 'order',
  type: 'number',
  label: 'Ordre',
  admin: {
    step: 1,
    description: `Ordre d’affichage : 1 s’affiche en premier, 2 en deuxième, etc. Laissez vide pour classer ${fallback}.`,
  },
})
