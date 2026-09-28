import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page. Paths are relative
 * to the `baseURL` in playwright.config.ts.
 */
export async function login({ page, user }: LoginOptions): Promise<void> {
  await page.goto('/admin/login')

  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL('/admin')

  // The admin only ships French (supportedLanguages in payload.config.ts).
  const dashboardArtifact = page.locator('span[title="Tableau de bord"]')
  await expect(dashboardArtifact).toBeVisible()
}
