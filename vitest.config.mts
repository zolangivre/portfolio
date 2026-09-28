import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // `pnpm test:coverage` (unit project only). Measures the server-side
    // logic the unit suite owns; the rest is left to the layer that can
    // actually exercise it.
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**', 'src/proxy.ts', 'src/app/sitemap.ts'],
      exclude: [
        'src/lib/queries/**', // thin Payload + unstable_cache wrappers → integration
        'src/lib/payload.ts',
        'src/lib/og.tsx', // renders images → e2e smoke test
        'src/lib/adminLabels.ts', // admin panel wording
        'src/lib/motion/**', // animation constants
        'src/hooks/use*.ts', // client-side React hooks → dom
        'src/lib/pendingScrollHash.ts', // module-level variable, nothing to branch on
      ],
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
    projects: [
      {
        // Pure logic: no database, no env. Anything with I/O is mocked.
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.spec.ts'],
          // Every test starts from blank mocks, env and globals, so no
          // file needs its own afterEach to undo what the last test set.
          mockReset: true,
          unstubEnvs: true,
          unstubGlobals: true,
        },
      },
      {
        // Real Payload against a throwaway Postgres rebuilt from the
        // migrations on every run — see tests/setup/int.global.ts.
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.int.spec.ts'],
          globalSetup: ['./tests/setup/int.global.ts'],
          setupFiles: ['./tests/setup/int.ts'],
          // One database for the whole suite: files run one at a time so
          // their fixtures can't collide.
          fileParallelism: false,
          hookTimeout: 60_000,
          testTimeout: 30_000,
        },
      },
      {
        // React components rendered with Testing Library.
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/dom/**/*.spec.tsx'],
        },
      },
    ],
  },
})
