import { expect, test } from '@playwright/test'

import { loginAsEditor } from './api'
import { journalEntries, projects } from './fixtures'
import { primaryNav } from './ui'

/**
 * A save in Payload has to reach the prerendered pages through the cache
 * tags — the chain src/lib/cache.ts describes. These edit through the REST
 * API, check the site follows, then put the content back.
 *
 * The hooks expire tags outright (src/hooks/revalidateSite.ts), so every
 * check below is made once, on the very first request after the save: an
 * editor reloading the page must see the edit, not the page from before it.
 */

const [alpha] = projects

test('editing a project updates its page on the next request', async ({ page, request }) => {
  const admin = await loginAsEditor(request)
  const {
    docs: [project],
  } = await admin.find('projects', { slug: { equals: alpha.slug } })

  // The heading's accessible name is the full title from the first byte of
  // HTML; the visible text is typed out after hydration.
  const expectTitle = async (locale: 'fr' | 'en', title: string) => {
    await page.goto(`/${locale}/projects/${alpha.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(title)
  }

  const edited = `${alpha.fr} (modifié)`

  await admin.update('projects', project!.id, { title: edited })

  try {
    await expectTitle('fr', edited)
    // Tags aren't locale-scoped, but the English title didn't change.
    await expectTitle('en', alpha.en)
  } finally {
    await admin.update('projects', project!.id, { title: alpha.fr })
    await expectTitle('fr', alpha.fr)
  }
})

test('turning sections off hides them everywhere at once', async ({ page, request }) => {
  const admin = await loginAsEditor(request)
  const status = async (path: string) => (await request.get(path)).status()
  const sitemap = async () => (await request.get('/sitemap.xml')).text()
  const headerLinks = async () => {
    await page.goto('/fr')
    return primaryNav(page).getByRole('link').allTextContents()
  }

  expect(await headerLinks()).toEqual(['Projets', 'Contact', 'Journal'])

  // `journal` has its own header link and pages; `contact` is a homepage
  // section reached through a CMS-authored `#contact` link.
  await admin.updateGlobal('sections-visibility', { contact: false, journal: false })

  try {
    expect(await status('/fr/journal')).toBe(404)
    expect(await status(`/fr/journal/${journalEntries[0].slug}`)).toBe(404)
    expect(await sitemap()).not.toContain('/journal')
    expect(await headerLinks()).toEqual(['Projets'])
    await expect(page.locator('#contact')).toHaveCount(0)
  } finally {
    await admin.updateGlobal('sections-visibility', { contact: true, journal: true })
    expect(await status('/fr/journal')).toBe(200)
    expect(await sitemap()).toContain('/fr/journal')
    expect(await headerLinks()).toEqual(['Projets', 'Contact', 'Journal'])
  }
})
