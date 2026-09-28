import { expect, test, type Page } from '@playwright/test'

import { journalEntries, projects } from './fixtures'
import { primaryNav } from './ui'

/**
 * Runs in the mobile project only (an iPhone on WebKit, see
 * playwright.config.ts), where the header collapses into a drawer.
 */

const openButton = (page: Page) => page.getByRole('button', { name: 'Ouvrir le menu' })
const closeButton = (page: Page) => page.getByRole('button', { name: 'Fermer le menu' })

test.beforeEach(async ({ page }) => {
  await page.goto('/fr/journal')
})

test('the closed menu keeps its links out of reach', async ({ page }) => {
  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false')
  // Hidden, not just slid off-screen: out of the tab order and the
  // accessibility tree as well.
  await expect(primaryNav(page)).toBeHidden()
})

test('the menu opens, and closes with Escape', async ({ page }) => {
  await openButton(page).click()

  await expect(closeButton(page)).toHaveAttribute('aria-expanded', 'true')
  await expect(primaryNav(page).getByRole('link', { name: 'Projets' })).toBeVisible()
  // The page behind stays put while the drawer is open.
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  await page.keyboard.press('Escape')

  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false')
  await expect(primaryNav(page)).toBeHidden()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('tapping outside the drawer closes it', async ({ page }) => {
  await openButton(page).click()
  await expect(primaryNav(page)).toBeVisible()

  // The scrim covers the page to the left of the drawer.
  await page.mouse.click(20, 400)

  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false')
})

test('choosing a link closes the menu and goes there', async ({ page }) => {
  await openButton(page).click()
  await primaryNav(page).getByRole('link', { name: 'Projets' }).click()

  await expect(page).toHaveURL('/fr#projects')
  await expect(page.locator('#projects')).toBeInViewport()
  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false')
})

for (const path of [
  '/fr',
  '/en',
  '/fr/projects',
  `/fr/projects/${projects[0]!.slug}`,
  '/fr/journal',
  `/fr/journal/${journalEntries[0].slug}`,
]) {
  test(`${path} does not scroll sideways`, async ({ page }) => {
    await page.goto(path)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    expect(overflow).toBeLessThanOrEqual(0)
  })
}
