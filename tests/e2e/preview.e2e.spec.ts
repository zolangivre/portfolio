import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
import { loginAsEditor } from './api'
import { editor, privateProject, projects } from './fixtures'

/**
 * Live Preview: /api/preview turns on Draft Mode for a logged-in editor, and
 * the site then shows what visitors can't see yet. The seeded "Projet caché"
 * is a project that was never published.
 */

const BYPASS_COOKIE = '__prerender_bypass'
const hiddenPage = `/fr/projects/${privateProject.slug}`
const exitButtonName = /quitter/i

test.describe('the preview route', () => {
  test('refuses a request without a session', async ({ request }) => {
    const response = await request.get('/api/preview?path=/fr', { maxRedirects: 0 })

    expect(response.status()).toBe(401)
  })

  test('refuses an unsafe path, even for an editor', async ({ page }) => {
    await login({ page, user: editor })

    for (const path of ['//evil.com', 'https://evil.com', '/admin', '/de', '']) {
      const response = await page.request.get(`/api/preview?path=${encodeURIComponent(path)}`, {
        maxRedirects: 0,
      })

      expect(response.status(), `path ${JSON.stringify(path)}`).toBe(400)
    }
    expect((await page.context().cookies()).map((cookie) => cookie.name)).not.toContain(
      BYPASS_COOKIE,
    )
  })

  test('redirects an editor to the page and sets the Draft Mode cookie', async ({ page }) => {
    await login({ page, user: editor })

    const response = await page.request.get('/api/preview?path=/fr', { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(new URL(response.headers().location!, 'http://localhost').pathname).toBe('/fr')
    expect(response.headers()['set-cookie']).toContain(BYPASS_COOKIE)
  })

  test('exiting redirects to the page, or to / when the path is unsafe', async ({ page }) => {
    await login({ page, user: editor })

    const exit = async (path: string) => {
      const response = await page.request.post('/api/exit-preview', {
        form: { path },
        maxRedirects: 0,
      })
      // 303, so the browser follows with a GET rather than re-POSTing.
      expect(response.status()).toBe(303)
      return new URL(response.headers().location!, 'http://localhost')
    }

    expect((await exit('/en')).pathname).toBe('/en')

    const unsafe = await exit('//evil.com')
    expect(unsafe.host).toBe('localhost')
    expect(unsafe.pathname).toBe('/')
  })
})

test.describe('the site in preview', () => {
  test('keeps a never-published project hidden from a visitor', async ({ page }) => {
    const response = await page.goto(hiddenPage)

    expect(response?.status()).toBe(404)
    expect((await page.context().cookies()).map((cookie) => cookie.name)).not.toContain(
      BYPASS_COOKIE,
    )
  })

  test('keeps a never-published project hidden from a logged-in editor outside the preview', async ({
    page,
  }) => {
    await login({ page, user: editor })

    const response = await page.goto(hiddenPage)

    expect(response?.status()).toBe(404)
  })

  test('shows the draft, then hides it again once the editor exits', async ({ page }) => {
    await login({ page, user: editor })

    await page.goto(`/api/preview?path=${encodeURIComponent(hiddenPage)}`)

    await expect(page).toHaveURL(new RegExp(`${hiddenPage}$`))
    expect((await page.context().cookies()).map((cookie) => cookie.name)).toContain(BYPASS_COOKIE)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(privateProject.fr)

    const exit = page.getByRole('button', { name: exitButtonName })
    await expect(exit).toBeVisible()

    await exit.click()

    // The form sends the editor back to the page they were on, which is a 404
    // now that Draft Mode is off.
    await expect(page.getByRole('button', { name: exitButtonName })).toHaveCount(0)
    expect((await page.context().cookies()).map((cookie) => cookie.name)).not.toContain(
      BYPASS_COOKIE,
    )

    const response = await page.goto(hiddenPage)
    expect(response?.status()).toBe(404)
  })

  test('lists the draft project on the homepage while previewing', async ({ page }) => {
    await login({ page, user: editor })

    await page.goto('/api/preview?path=/fr')

    await expect(page.getByRole('button', { name: exitButtonName })).toBeVisible()
    await expect(page.getByText(privateProject.fr).first()).toBeVisible()
  })

  test('shows no banner to a visitor', async ({ page }) => {
    await page.goto('/fr')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: exitButtonName })).toHaveCount(0)
  })
})

test.describe('the admin', () => {
  test('offers Live Preview on a project and on a global', async ({ page, request }) => {
    await login({ page, user: editor })

    const admin = await loginAsEditor(request)
    const {
      docs: [project],
    } = await admin.find('projects', { slug: { equals: projects[0].slug } })

    await page.goto(`/admin/collections/projects/${project!.id}`)
    await expect(page.locator('#live-preview-toggler')).toBeVisible()

    await page.goto('/admin/globals/hero')
    await expect(page.locator('#live-preview-toggler')).toBeVisible()
  })

  // The frame is the feature: a header that forbids framing leaves the
  // toggler working and the panel blank.
  test('renders the page inside the Live Preview frame', async ({ page, request }) => {
    await login({ page, user: editor })

    const admin = await loginAsEditor(request)
    const {
      docs: [project],
    } = await admin.find('projects', { slug: { equals: projects[0].slug } })

    await page.goto(`/admin/collections/projects/${project!.id}`)
    await page.locator('#live-preview-toggler').click()

    const frame = page.frameLocator('iframe.live-preview-iframe, .live-preview-window iframe')
    await expect(frame.getByRole('heading', { level: 1, name: projects[0].fr })).toBeVisible()
  })
})
