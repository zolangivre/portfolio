import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'

/** Average brightness (0–255) of a region of the screen. */
async function brightness(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
) {
  const { channels } = await sharp(await page.screenshot({ clip })).stats()

  return (channels[0].mean + channels[1].mean + channels[2].mean) / 3
}

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
      'aria-pressed',
      'true',
    )

    // Survives a reload and a change of page, over the system preference.
    await page.goto('/fr/journal')
    await expect(html).toHaveClass(/\bdark\b/)

    await themes.getByRole('button', { name: 'Thème clair' }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await page.reload()
    await expect(html).not.toHaveClass(/\bdark\b/)
  })

  // On its own transition layer, the header took the new theme at once, its
  // fade to the page colour darkening the old page until the reveal got there.
  test('the reveal starts from the old theme under a scrolled header', async ({ page }) => {
    // Holds the transition on its first frame: the circle has no size yet, so
    // what's on screen is the old theme, everywhere.
    await page.addInitScript(() => {
      const start = document.startViewTransition.bind(document)

      document.startViewTransition = (callback) => {
        const transition = start(callback)

        void transition.ready.then(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect

            if (effect.pseudoElement?.startsWith('::view-transition')) {
              animation.pause()
              animation.currentTime = 0
            }
          }
          document.documentElement.dataset.revealHeld = ''
        })

        return transition
      }
    })

    await page.goto('/fr')

    const header = page.locator('.site-header')

    await page.evaluate(() => window.scrollTo({ behavior: 'instant', top: 800 }))
    await expect(header).toHaveAttribute('data-scrolled', 'true')
    await expect
      .poll(() => header.evaluate((element) => getComputedStyle(element, '::before').opacity))
      .toBe('1')

    // Left of the glass pane: nothing there but the header's fade.
    const box = await header.boundingBox()
    const edge = { height: box!.height, width: 16, x: 0, y: 0 }
    const before = await brightness(page, edge)

    await page
      .getByRole('group', { name: 'Changer de thème' })
      .getByRole('button', { name: 'Thème sombre' })
      .click()
    await expect(page.locator('html')).toHaveAttribute('data-reveal-held', '')

    expect(Math.abs((await brightness(page, edge)) - before)).toBeLessThan(5)
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
  for (const path of ['/fr', '/fr/journal', '/admin/login']) {
    const headers = (await request.get(path)).headers()

    // The site's pages may be framed by the admin's Live Preview, on the
    // same origin only; the admin itself is never framed.
    if (path.startsWith('/admin')) {
      expect(headers['x-frame-options'], path).toBe('DENY')
      expect(headers['content-security-policy'], path).toBeUndefined()
    } else {
      expect(headers['x-frame-options'], path).toBe('SAMEORIGIN')
      expect(headers['content-security-policy'], path).toBe("frame-ancestors 'self'")
    }
    expect(headers['x-content-type-options'], path).toBe('nosniff')
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy'], path).toContain('camera=()')
  }
})
