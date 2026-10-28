import { expect, test, type Page } from '@playwright/test'

import { login } from '../helpers/login'
import { editor, projects } from './fixtures'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()

    await login({ page, user: editor })
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('span[title="Tableau de bord"]').first()).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/projects')
    await expect(page).toHaveURL(/\/admin\/collections\/projects(\?|$)/)
    await expect(page.locator('h1', { hasText: 'Projets' }).first()).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('lists draft projects to editors', async () => {
    await page.goto('/admin/collections/projects')
    await expect(page.getByText('Projet caché')).toBeVisible()
  })

  // Projects are orderable: Payload adds a drag-handle column to the list.
  test('lets editors reorder projects by drag and drop', async () => {
    await page.goto('/admin/collections/projects')
    await expect(page.getByText('Projet Alpha')).toBeVisible()

    // One handle per row: published projects plus the draft one.
    await expect(page.locator('td.cell-_dragHandle')).toHaveCount(projects.length + 1)
  })

  // Globals have drafts, but unpublishing would write the last draft over the
  // row the site reads: Publish stays, Unpublish is hidden.
  test('offers Publish but no Unpublish on a global', async () => {
    await page.goto('/admin/globals/hero')

    const publish = page.locator('#action-save')
    await expect(publish).toBeVisible()
    await expect(publish).toHaveText('Publier les modifications')

    // Unpublish sits in the "…" menu of the document controls. With the
    // button hidden that menu may not exist at all: open it only when present.
    const dots = page.locator('.doc-controls__dots')
    if (await dots.isVisible()) {
      await dots.click()
    }
    await expect(page.locator('#action-unpublish')).toHaveCount(0)
    await expect(page.getByText('Annuler la publication')).toHaveCount(0)
  })
})
