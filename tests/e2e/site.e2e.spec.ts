import { expect, test } from '@playwright/test'

test.describe('theme toggle', () => {
  test.use({ colorScheme: 'light' })

  test('switches theme and remembers the choice', async ({ page }) => {
    const html = page.locator('html')
    const themes = page.getByRole('group', { name: 'Changer de thème' })

    await page.goto('/fr')
    await expect(html).not.toHaveClass(/\bdark\b/)

    await themes.getByRole('button', { name: 'Thème sombre' }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(themes.getByRole('button', { name: 'Thème sombre' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    // Survives a reload and a change of page, over the system preference.
    await page.goto('/fr/projects')
    await expect(html).toHaveClass(/\bdark\b/)

    await themes.getByRole('button', { name: 'Thème clair' }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await page.reload()
    await expect(html).not.toHaveClass(/\bdark\b/)
  })
})

test('the skip link is the first stop and moves focus past the header', async ({ page }) => {
  await page.goto('/fr')

  const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' })

  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeInViewport()

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)

  // The next Tab lands inside the main content, not back in the header.
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#main-content')))).toBe(
    true,
  )
})

test('security headers are sent on pages and the admin', async ({ request }) => {
  for (const path of ['/fr', '/fr/projects', '/admin/login']) {
    const headers = (await request.get(path)).headers()

    expect(headers['x-frame-options'], path).toBe('DENY')
    expect(headers['x-content-type-options'], path).toBe('nosniff')
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy'], path).toContain('camera=()')
  }
})
