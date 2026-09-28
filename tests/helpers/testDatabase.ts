import { config } from 'dotenv'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Loads `.env.test` — and only that file. The regular `.env` is left out on
 * purpose: it holds the R2 keys (uploads would land in the real bucket) and,
 * commented or not, the production database URL.
 *
 * Variables already set in the shell win, so CI can point at its own service
 * container. `assertTestDatabase` is what keeps that from going wrong.
 */
export function loadTestEnv(): void {
  config({ path: '.env.test' })
}

/**
 * Throws unless DATABASE_URL is a local database whose name ends in `-test`
 * (or `_test`). The integration suite drops every table before it runs, so
 * this is the only thing standing between a stray `DATABASE_URL=… pnpm
 * test:int` and the dev or production data.
 */
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  if (!url) {
    throw new Error('DATABASE_URL is not set — the integration tests read it from .env.test.')
  }

  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error('DATABASE_URL is not a valid connection string.')
  }

  const database = parsed.pathname.replace(/^\//, '')

  if (!LOCAL_HOSTS.has(parsed.hostname) || !/[-_]test$/.test(database)) {
    throw new Error(
      `Refusing to run the integration tests against "${parsed.hostname}/${database}": ` +
        'they drop every table first, so DATABASE_URL must be a local database named *-test.',
    )
  }
}
