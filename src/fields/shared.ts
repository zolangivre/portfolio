import type { CheckboxField } from 'payload'

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
