import { expect, type Page } from '@playwright/test'

/**
 * Below 880px the header links and controls sit in a drawer behind the menu
 * button. Opens it when that's the layout, so a spec can run on desktop and
 * mobile alike.
 */
export async function openMenuIfCollapsed(page: Page) {
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' })

  if (await toggle.isVisible()) {
    await toggle.click()
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  }
}

export const primaryNav = (page: Page) =>
  page.getByRole('navigation', { name: 'Navigation principale' })
