/**
 * The e2e web server: seeds the database, builds the site, starts it on 3100.
 * Playwright runs it as its webServer command; `pnpm test:e2e:serve` runs it
 * by hand, to keep a server up between runs.
 *
 * Everything happens in this one process tree so that `.env.e2e` covers all
 * three steps. `next build` / `next start` read `.env` on their own and only
 * skip variables already set — launched without this, they'd build against
 * the dev database.
 */
import { execFileSync } from 'node:child_process'

import { assertTestDatabase, loadTestEnv } from '../helpers/testDatabase'

loadTestEnv('.env.e2e')
assertTestDatabase()

const env = {
  ...process.env,
  // Its own build directory, and with it its own data cache: see next.config.ts.
  NEXT_DIST_DIR: '.next-e2e',
}

const run = (args: string[]) => execFileSync('pnpm', args, { env, stdio: 'inherit' })

run(['exec', 'tsx', 'tests/e2e/prepare.ts'])
run(['build'])
// Blocks for as long as the server runs; Playwright stops it after the suite.
run(['start', '--port', '3100'])
