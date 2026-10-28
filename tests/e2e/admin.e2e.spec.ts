import { expect, test, type Page } from '@playwright/test'

import { textToLexicalParagraphs } from '../../src/lib/richText'
import { login } from '../helpers/login'
import { loginAsEditor } from './api'
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

  // "Supprimer" on a collection with a trash moves the document there instead
  // of erasing it, and the trash view can bring it back. The project is
  // created for the test so the seeded ones stay as they are.
  test('moves a deleted project to the trash and restores it', async ({ request }) => {
    const title = 'Projet corbeille E2E'
    // A cell of the list, not any text: the toast also names the project.
    const row = page.locator('td', { hasText: title })
    const api = await loginAsEditor(request)
    const { id } = await api.create('projects', {
      _status: 'published',
      description: textToLexicalParagraphs('Description.'),
      shortDescription: 'Courte description.',
      slug: 'e2e-trash',
      title,
    })

    try {
      await page.goto(`/admin/collections/projects/${id}`)
      await expect(page.locator('input[name="title"]')).toHaveValue(title)

      await page.locator('.doc-controls__dots').click()
      await page.locator('#action-delete').click()
      await page.locator('#confirm-action').click()

      // Gone from the regular list...
      await expect(page).toHaveURL(/\/admin\/collections\/projects(\?|$)/)
      await expect(row).toHaveCount(0)

      // ...and listed in the trash view.
      await page.goto('/admin/collections/projects/trash')
      await expect(row).toBeVisible()

      await page.goto(`/admin/collections/projects/trash/${id}`)
      await page.locator('#action-restore').click()
      await page.locator('#confirm-action').click()
      await expect(page).toHaveURL(/\/admin\/collections\/projects\/\d+/)

      await page.goto('/admin/collections/projects')
      await expect(row).toBeVisible()

      await page.goto('/admin/collections/projects/trash')
      await expect(row).toHaveCount(0)
    } finally {
      await api.remove('projects', id)
    }
  })
})
