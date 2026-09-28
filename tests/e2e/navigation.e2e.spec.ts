import { expect, test } from '@playwright/test'

import { hero, journalEntries, privateJournalEntry, privateProject, projects } from './fixtures'

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

  await page
    .getByRole('group', { name: 'Changer de langue' })
    .getByRole('link', { name: /^en$/i })
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

test('the archive lists every public project and nothing else', async ({ page }) => {
  await page.goto('/fr/projects')

  for (const project of [alpha, beta, gamma]) {
    await expect(page.getByRole('heading', { name: project.fr })).toBeVisible()
  }
  await expect(page.getByText(privateProject.fr)).toHaveCount(0)
})

test.describe('pages that must not exist', () => {
  for (const path of [
    `/fr/projects/${privateProject.slug}`,
    `/en/projects/${privateProject.slug}`,
    '/fr/projects/does-not-exist',
    `/fr/journal/${privateJournalEntry.slug}`,
    '/fr/journal/does-not-exist',
    '/de',
  ]) {
    test(`${path} answers 404`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBe(404)
    })
  }
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
