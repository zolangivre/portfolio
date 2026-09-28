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

/** Public projects, in the order the site lists them (by `order`). */
export const projects = [
  { en: 'Alpha project', fr: 'Projet Alpha', slug: 'e2e-alpha' },
  { en: 'Beta project', fr: 'Projet Beta', slug: 'e2e-beta' },
  { en: 'Gamma project', fr: 'Projet Gamma', slug: 'e2e-gamma' },
] as const

export const privateProject = { en: 'Hidden project', fr: 'Projet caché', slug: 'e2e-hidden' }

export const journalEntries = [
  { en: 'First memory', fr: 'Premier souvenir', slug: 'e2e-first-memory' },
] as const

export const privateJournalEntry = {
  en: 'Private memory',
  fr: 'Souvenir privé',
  slug: 'e2e-private-memory',
}
