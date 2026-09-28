import { defineConfig, devices } from '@playwright/test'

import { assertTestDatabase, loadTestEnv } from './tests/helpers/testDatabase'

/**
 * The suite runs against a production build (`next build && next start`) on
 * its own port and its own seeded database — never `pnpm dev` and the dev
 * data. Dev mode skips the data cache entirely, so only a real build can show
 * that a save in Payload actually reaches the cached pages.
 *
 * The server command rebuilds the database and the site on every run (a
 * couple of minutes). To iterate on specs, keep `pnpm test:e2e:serve` running
 * in another terminal: outside CI, Playwright reuses a server already up on
 * the port.
 */
loadTestEnv('.env.e2e')
assertTestDatabase()

const PORT = 3100
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One seeded database for every spec, and some specs edit it (then put it
  // back): run them one at a time so none sees another's edit.
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/mobile.e2e.spec.ts',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
    {
      // Safari's engine at phone width: the collapsed header, and the visitor
      // journeys a recruiter opening a link from their phone takes.
      name: 'mobile-safari',
      testMatch: ['**/mobile.e2e.spec.ts', '**/navigation.e2e.spec.ts'],
      use: { ...devices['iPhone 15'] },
    },
  ],
  webServer: {
    command: 'pnpm exec tsx tests/e2e/serve.ts',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 60 * 1000,
    stdout: 'pipe',
  },
})
