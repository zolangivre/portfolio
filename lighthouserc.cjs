/**
 * Lighthouse CI: `pnpm lighthouse`, and the Lighthouse job of ci.yml.
 *
 * Measures the production build the e2e suite serves (tests/e2e/serve.ts),
 * with its seeded database. The seed has no images or video, so this says
 * nothing about real LCP or page weight (production: Speed Insights). There's
 * no budget on LCP: on these pages it's a simulated figure, 4 s when the paint
 * observed took 54 ms. What holds up is the JavaScript and the layout getting
 * worse from one PR to the next.
 *
 * Every budget only warns, and the Lighthouse job isn't a required check.
 * Budgets are a little above what the site measured on 2026-10-30 (home 325 KB
 * of script, the heaviest page 356 KB). Raising one is a decision: look at what
 * grew first (`pnpm analyze`).
 */
const budget = (options) => ['warn', { aggregationMethod: 'median-run', ...options }]

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm test:e2e:serve',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 10 * 60 * 1000,
      url: [
        'http://localhost:3100/fr',
        'http://localhost:3100/fr/projects/e2e-alpha',
        'http://localhost:3100/fr/journal/e2e-first-memory',
      ],
      // Keeps the median run: a single one swings too much on a shared runner.
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': budget({ minScore: 0.8 }),
        'categories:accessibility': budget({ minScore: 1 }),
        'cumulative-layout-shift': budget({ maxNumericValue: 0.05 }),
        'total-blocking-time': budget({ maxNumericValue: 200 }),
        'resource-summary:script:size': budget({ maxNumericValue: 380_000 }),
        'total-byte-weight': budget({ maxNumericValue: 600_000 }),
      },
    },
    upload: {
      // Not `temporary-public-storage`: reports stay in the run's artifacts.
      target: 'filesystem',
      outputDir: 'lighthouse-report',
    },
  },
}
