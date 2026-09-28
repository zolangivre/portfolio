/**
 * The content tests/e2e/prepare.ts seeds, shared with the specs so assertions
 * name the same values the database holds.
 */

export const editor = { email: 'e2e-editor@test.local', password: 'e2e-editor-password' }

export const hero = { en: 'E2E hero title', fr: 'Titre hero E2E' }

export const contactSuccess = {
  en: 'E2E: message received.',
  fr: 'E2E : message bien reçu.',
}

/** Header links, in order. Section anchors resolve to the homepage. */
export const navigation = [
  { en: 'Projects', fr: 'Projets', href: '#projects' },
  { en: 'Contact', fr: 'Contact', href: '#contact' },
] as const

export const technologies = [
  { name: 'React', slug: 'e2e-react' },
  { name: 'Payload', slug: 'e2e-payload' },
  { name: 'Docker', slug: 'e2e-docker' },
] as const

type TechnologyName = (typeof technologies)[number]['name']

/** Public projects, in the order the site lists them (by `order`). */
export const projects: readonly {
  en: string
  fr: string
  slug: string
  technologies: readonly TechnologyName[]
}[] = [
  {
    en: 'Alpha project',
    fr: 'Projet Alpha',
    slug: 'e2e-alpha',
    technologies: ['React', 'Payload'],
  },
  { en: 'Beta project', fr: 'Projet Beta', slug: 'e2e-beta', technologies: ['Payload'] },
  { en: 'Gamma project', fr: 'Projet Gamma', slug: 'e2e-gamma', technologies: ['Docker'] },
]

export const privateProject = { en: 'Hidden project', fr: 'Projet caché', slug: 'e2e-hidden' }

/**
 * Public journal entries. `category` is the slug of a category the
 * migrations seed; `categoryName` its French name, as the filter shows it.
 */
export const journalEntries = [
  {
    category: 'journal-sport',
    categoryName: 'Sport',
    en: 'First memory',
    fr: 'Premier souvenir',
    slug: 'e2e-first-memory',
  },
  {
    category: 'journal-travel',
    categoryName: 'Voyage',
    en: 'Second memory',
    fr: 'Second souvenir',
    slug: 'e2e-second-memory',
  },
] as const

export const privateJournalEntry = {
  category: 'journal-sport',
  en: 'Private memory',
  fr: 'Souvenir privé',
  slug: 'e2e-private-memory',
}
