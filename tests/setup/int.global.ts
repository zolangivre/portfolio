import { execFileSync } from 'node:child_process'

import { assertTestDatabase, loadTestEnv } from '../helpers/testDatabase'

/**
 * Runs once before the integration suite: drops the test database and
 * rebuilds it from the migrations, through the same CLI `pnpm ci` uses in
 * production. A migration that fails, or that leaves the schema short of what
 * the config expects, fails the run here or in schema.int.spec.ts.
 */
export default function setup(): void {
  loadTestEnv()
  assertTestDatabase()

  execFileSync('pnpm', ['exec', 'payload', 'migrate:fresh', '--force-accept-warning'], {
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
    stdio: 'inherit',
  })
}
