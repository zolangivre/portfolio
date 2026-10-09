import { expect, test, type Page } from '@playwright/test'

import { hero, journalEntries, privateJournalEntry, privateProject, projects } from './fixtures'
import { openMenuIfCollapsed, primaryNav } from './ui'

const [alpha, beta, gamma] = projects

test.describe('locale detection', () => {
  test.describe('French browser', () => {
    test.use({ locale: 'fr-FR' })

    test('lands on the French homepage', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL(/\/fr$/)
      await expect(page.locator('h1').first()).toHaveText(hero.fr)
    })
  })

  test.describe('English browser', () => {
    test.use({ locale: 'en-US' })

    test('lands on the English homepage', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL(/\/en$/)
      await expect(page.locator('h1').first()).toHaveText(hero.en)
    })

    test('keeps the rest of the path when adding the locale', async ({ page }) => {
      await page.goto(`/projects/${alpha.slug}`)

      await expect(page).toHaveURL(`/en/projects/${alpha.slug}`)
    })
  })
})

test('the language switcher keeps the current page', async ({ page }) => {
  await page.goto(`/fr/projects/${alpha.slug}`)
  await expect(page.locator('h1').first()).toHaveText(alpha.fr)

  await openMenuIfCollapsed(page)
  await page
    .getByRole('group', { name: 'Changer de langue' })
    .getByRole('link', { name: 'English (EN)' })
    .click()

  await expect(page).toHaveURL(`/en/projects/${alpha.slug}`)
  await expect(page.locator('h1').first()).toHaveText(alpha.en)
})

test('a visitor can go from the homepage through the projects and back', async ({ page }) => {
  await page.goto('/fr')

  await page.locator('#projects').getByRole('link', { name: alpha.fr }).first().click()
  await expect(page).toHaveURL(`/fr/projects/${alpha.slug}`)
  await expect(page.locator('h1').first()).toHaveText(alpha.fr)

  const adjacent = page.getByRole('navigation', { name: 'Navigation entre les projets' })

  await adjacent.getByRole('link', { name: new RegExp(beta.fr) }).click()
  await expect(page).toHaveURL(`/fr/projects/${beta.slug}`)

  await adjacent.getByRole('link', { name: new RegExp(alpha.fr) }).click()
  await expect(page).toHaveURL(`/fr/projects/${alpha.slug}`)

  await page.getByRole('link', { name: '← Retour aux projets' }).click()
  await expect(page).toHaveURL('/fr#projects')
})

/**
 * Section links point at anchors that only exist on the homepage. From any
 * other page, the click has to navigate there and then scroll to the section
 * once it has rendered — the job of HashScrollHandler, RouteScrollManager and
 * pendingScrollHash, written around a race with the router's own hash
 * handling. Nothing short of a browser can check it.
 */
test.describe('section links in the header', () => {
  const followNavLink = async (page: Page, from: string, label: string) => {
    await page.goto(from)
    await openMenuIfCollapsed(page)
    await primaryNav(page).getByRole('link', { name: label, exact: true }).click()
  }

  test('reach their section from another page', async ({ page }) => {
    await followNavLink(page, '/fr/journal', 'Projets')

    await expect(page).toHaveURL('/fr#projects')
    await expect(page.locator('#projects')).toBeInViewport()
  })

  test('reach their section from a project page', async ({ page }) => {
    await followNavLink(page, `/fr/projects/${alpha.slug}`, 'Contact')

    await expect(page).toHaveURL('/fr#contact')
    await expect(page.locator('#contact')).toBeInViewport()
  })

  test('scroll to their section on the homepage itself', async ({ page }) => {
    await followNavLink(page, '/fr', 'Contact')

    await expect(page).toHaveURL('/fr#contact')
    await expect(page.locator('#contact')).toBeInViewport()
  })
})

test('a new page opens at its top, not where the last one was scrolled', async ({ page }) => {
  await page.goto('/fr')
  await page.locator('#projects').getByRole('link', { name: gamma.fr }).first().click()

  await expect(page).toHaveURL(`/fr/projects/${gamma.slug}`)
  await expect(page.locator('h1').first()).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50)
})

test.describe('pages that must not exist', () => {
  for (const path of [
    // The archive was removed: projects live on the homepage only.
    '/fr/projects',
    `/fr/projects/${privateProject.slug}`,
    `/en/projects/${privateProject.slug}`,
    '/fr/projects/does-not-exist',
    `/fr/journal/${privateJournalEntry.slug}`,
    '/fr/journal/does-not-exist',
    '/fr/nothing/here',
    '/de',
  ]) {
    test(`${path} answers 404`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBe(404)
    })
  }

  // Unmatched URLs used to get Next's bare default 404; the [...rest]
  // catch-all routes them to the site's own page, inside the site layout.
  test('an unknown URL shows the site 404, not the framework one', async ({ page }) => {
    await page.goto('/en/nothing/here')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist.')
    await expect(page.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/en')
    await expect(page.locator('.site-header')).toBeVisible()
  })
})

test('the sitemap lists public pages only', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()

  for (const locale of ['fr', 'en']) {
    expect(sitemap).toContain(`http://localhost:3100/${locale}/projects/${alpha.slug}`)
    expect(sitemap).toContain(`http://localhost:3100/${locale}/journal/${journalEntries[0].slug}`)
  }
  expect(sitemap).not.toContain(privateProject.slug)
  expect(sitemap).not.toContain(privateJournalEntry.slug)
})

test('share images render', async ({ page, request }) => {
  for (const path of [
    '/fr',
    `/fr/projects/${alpha.slug}`,
    `/fr/journal/${journalEntries[0].slug}`,
  ]) {
    await page.goto(path)

    const image = await page.locator('meta[property="og:image"]').first().getAttribute('content')
    expect(image, path).toBeTruthy()

    const response = await request.get(image!)
    expect(response.status(), image!).toBe(200)
    expect(response.headers()['content-type'], image!).toBe('image/png')
  }
})
