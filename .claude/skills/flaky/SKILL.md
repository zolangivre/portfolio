---
name: flaky
description: Hunt flaky tests — Playwright e2e (chromium, mobile-safari), Vitest unit and integration. Finds them in CI history (tests that passed on retry) and by local repetition, finds the cause (shared seeded data, timing, animation, cache, order), fixes the test or the app, and proves it by repetition. Never hides a flaky test behind retries or a skip. Ships the fix with /ship. Example: /flaky, /flaky e2e --repeat 20.
disable-model-invocation: true
argument-hint: '[e2e|unit|int] [--repeat N]'
---

# Flaky tests

Arguments: `$ARGUMENTS`. `e2e`, `unit` or `int` for one suite (all three by
default). `--repeat N`: repetitions (default 10 for e2e and int, 30 for
unit).

A flaky test costs twice: CI minutes spent on retries, and, worse, failures
nobody reads anymore, until one hides a real regression. CI retries a failed
e2e test **twice** (`retries: 2` in `playwright.config.ts`): a flaky test
shows green there, until the day it fails three times in a row and turns
`staging` red. The goal is to **fix** it, never to hide it.

**Forbidden**: raising `retries`, adding `test.skip` / `test.fixme`,
lengthening a timeout without knowing why it expires, or changing the app's
behaviour to suit a test.

## Known cases

| Test | Cause | State |
| ---- | ----- | ----- |

Update this table on every run, in the same PR. A fixed case stays listed
with its fix: it could come back.

## 1. Find them

**In CI history**, without rerunning anything:

```sh
# runs on the same commit with several attempts: someone reran a flaky job
gh run list --workflow ci.yml -L 50 --json databaseId,headSha,conclusion,attempt,headBranch
# e2e tests that passed only on retry (the `github` reporter flags them)
gh run view <id> --log | grep -iE "flaky|retry #|[0-9]+ (flaky|failed)" | head -40
# report and traces of a red run (kept 7 days)
gh run download <id> -n playwright-report -D <scratchpad>/report-<id>
```

**By local repetition.**

- e2e runs against a production build on port 3100 and its own seeded
  database (`tests/e2e/serve.ts`). Locally, Playwright **reuses** a server
  already on 3100: check `lsof -nP -iTCP:3100 -sTCP:LISTEN` first, or you'd
  test another build. Postgres must be up (`docker compose up -d postgres`).
- WebKit doesn't install on this Mac. A `mobile-safari` failure is studied
  from CI (traces, reruns of the job); locally, the same spec in the
  `chromium` project only tells whether the engine matters.

```sh
# e2e: each test N times, no retry, one worker, as CI
CI=1 pnpm exec playwright test <file> -g "<title>" --project=chromium --repeat-each=<N> --retries=0 --workers=1
# unit: N passes, random order
for i in $(seq 1 <N>); do pnpm exec vitest run --project unit --sequence.shuffle --retry=0 || echo "FAIL pass $i"; done
# int: the database is rebuilt every run, so fewer passes
for i in $(seq 1 <N>); do pnpm test:int --sequence.shuffle --retry=0 || echo "FAIL pass $i"; done
```

To clear a suspect commit, compare **before / after** in two worktrees: the
same failure rate clears the commit.

Note for each failure the test, the error, and the pass it happened on.

## 2. Understand

Isolate the test (`-g "<title>"`, or its file alone), repeat it alone, then
with the whole suite:

| It fails…                                 | Lead                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| only with the whole suite                 | **shared state**: specs that edit the seeded content and put it back (`revalidation`, `admin`), the contact form's rate limit, a cache tag revalidated by another spec |
| alone too, now and then                   | **timing**: a `Reveal` or motion entrance still running, a view transition, a typewriter (`useTypewriter`), a fixed delay, `networkidle`                               |
| only on CI                                | **environment**: a slower runner (2 CPUs), fonts, WebKit, the production build's data cache                                                                            |
| depending on order (`--sequence.shuffle`) | **order dependency**: a mock or env not reset (unit runs with `mockReset`, `unstubEnvs`, `unstubGlobals`), int fixtures that collide                                   |

A failure's trace says almost everything (`test-results/<test>/trace.zip`, or
the CI report):

```sh
unzip -o <trace.zip> -d <scratchpad>/trace
# action log: "element is not stable" = it was moving, "not visible" = zero size
grep -h -o -E '"message":"[^"]*"' <scratchpad>/trace/*.trace | grep -v "locator resolved" | head -60
# failed requests
cat <scratchpad>/trace/*.network | jq -r 'select(.snapshot.response.status >= 400) | "\(.snapshot.response.status) \(.snapshot.request.url)"' | sort -u
```

A probe that polls the page often changes the timing and hides the failure:
prefer a `console.log` in a **copy** of the component (throwaway worktree),
read with `page.on('console')`.

## 3. Fix

- **The test** (most often): wait for the right signal (the end of an
  entrance through a computed style or `toBeVisible`, a precise response)
  rather than a delay; data the test owns; shared state put back in an
  `afterEach`, or seeded once in `prepare.ts` and `fixtures.ts`.
- **The app** (a real race): that's a bug. Handle it with `/bug`
  (`.claude/skills/bug/SKILL.md`), with a test that reproduces the race.
- **The environment** (cache, CI): fix the CI, in a `ci:` commit.

## 4. Prove it

The fixed test passes **N times in a row** in the conditions where it failed
(same project, same suite around it). One failure: back to step 2. A
`mobile-safari` fix is proven on CI: say so in the PR, and check the job's
result there.

Then ship with `.claude/skills/ship/SKILL.md`, from step 1. Commit
`test(<scope>): …` with the cause in the body; `fix(<scope>): …` if it was
the app, `ci: …` if it was the CI. Update **Known cases** in the same commit.

## Report

| Test | Cause | Fix | Green repetitions |
| ---- | ----- | --- | ----------------- |

Add the flaky tests found but not fixed, with what's known of their cause.
