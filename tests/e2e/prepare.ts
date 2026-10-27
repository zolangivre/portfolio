/**
 * Builds the e2e database from scratch: drops it, runs every migration, then
 * seeds the content in fixtures.ts. Runs as the first step of the Playwright
 * web server command, before `next build` — the build prerenders pages from
 * whatever the database holds, so the seed has to be in place first.
 *
 *   pnpm exec tsx tests/e2e/prepare.ts
 */
import { execFileSync } from 'node:child_process'

import { getPayload, type CollectionSlug } from 'payload'

import { textToLexicalParagraphs } from '../../src/lib/richText'
import { assertTestDatabase, loadTestEnv } from '../helpers/testDatabase'
import {
  contactSuccess,
  editor,
  hero,
  journalEntries,
  navigation,
  privateJournalEntry,
  privateProject,
  projects,
  technologies,
} from './fixtures'

loadTestEnv('.env.e2e')
assertTestDatabase()

execFileSync('pnpm', ['exec', 'payload', 'migrate:fresh', '--force-accept-warning'], {
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  stdio: 'inherit',
})

// Imported only now: the config reads DATABASE_URL when it loads.
const { default: config } = await import('../../src/payload.config')
const payload = await getPayload({ config })

// Nothing to invalidate yet — the site is built after this script.
const context = { disableRevalidate: true }

type Localized = { en: string; fr: string }
type Status = 'draft' | 'published'

/**
 * Creates a doc in French, then fills in its English variant. `localized`
 * returns every localized field for one locale's text: an update in a new
 * locale has to satisfy that locale's required fields on its own.
 *
 * `status` is always passed: with drafts enabled a Local API create that
 * doesn't say otherwise stores a draft, which the site would not show.
 */
async function createLocalized(
  collection: CollectionSlug,
  data: Record<string, unknown>,
  localized: (text: string) => Record<string, unknown>,
  text: Localized,
  status: Status,
) {
  const doc = await payload.create({
    collection,
    context,
    data: { ...data, ...localized(text.fr), _status: status } as never,
    locale: 'fr',
  })

  await payload.update({
    collection,
    context,
    data: { ...localized(text.en), _status: status } as never,
    id: doc.id,
    locale: 'en',
  })

  return doc
}

await payload.create({ collection: 'users', context, data: editor })

for (const locale of ['fr', 'en'] as const) {
  await payload.updateGlobal({ context, data: { title: hero[locale] }, locale, slug: 'hero' })
  await payload.updateGlobal({
    context,
    data: { successMessage: contactSuccess[locale] },
    locale,
    slug: 'contact',
  })
}

// The items array isn't localized but its labels are: write the rows in
// French, then give the English labels to the same row ids.
const { items } = await payload.updateGlobal({
  context,
  data: { items: navigation.map(({ fr, href }) => ({ href, label: fr })) },
  locale: 'fr',
  slug: 'navigation',
})
await payload.updateGlobal({
  context,
  data: {
    items: (items ?? []).map((item, index) => ({ ...item, label: navigation[index]!.en })),
  },
  locale: 'en',
  slug: 'navigation',
})

const technologyIds = new Map<string, number>()

for (const technology of technologies) {
  const doc = await payload.create({ collection: 'technologies', context, data: technology })
  technologyIds.set(technology.name, doc.id)
}

const projectFields = (title: string) => ({
  description: textToLexicalParagraphs(`${title} — description.`),
  shortDescription: `${title} — short description.`,
  title,
})

// A new document is prepended to the list, so create them last-first: the
// site then lists the projects in the order of the fixtures.
for (const project of [...projects].reverse()) {
  await createLocalized(
    'projects',
    {
      slug: project.slug,
      technologies: project.technologies.map((name) => technologyIds.get(name)!),
    },
    projectFields,
    project,
    'published',
  )
}

await createLocalized(
  'projects',
  {
    slug: privateProject.slug,
  },
  projectFields,
  privateProject,
  'draft',
)

// The journal categories come from the migrations.
const { docs: categories } = await payload.find({
  collection: 'categories',
  limit: 0,
  where: { group: { equals: 'journal' } },
})
const categoryId = (slug: string) => categories.find((category) => category.slug === slug)!.id

const journalFields = (title: string) => ({
  content: textToLexicalParagraphs(`${title} — content.`),
  shortDescription: `${title} — short description.`,
  title,
})

for (const [entry, status] of [
  ...journalEntries.map((entry) => [entry, 'published'] as const),
  [privateJournalEntry, 'draft'] as const,
]) {
  await createLocalized(
    'journal',
    {
      category: categoryId(entry.category),
      date: '2026-01-15T00:00:00.000Z',
      slug: entry.slug,
    },
    journalFields,
    entry,
    status,
  )
}

payload.logger.info('E2E database seeded.')

await payload.destroy()
process.exit(0)
