---
name: pre-pr
description: Run the same checks as CI (lint, typecheck, unit coverage, integration) plus commit-message and migration checks before opening a pull request.
disable-model-invocation: true
argument-hint: "[--e2e]"
---

# Pre-PR check

Mirror `.github/workflows/ci.yml` locally so a PR doesn't come back red. Run
the steps in order and keep going after a failure, so the report lists every
problem at once. Don't fix anything unless asked; report first.

## Context

- Branch: !`git branch --show-current`
- Commits not yet on staging: !`git log --oneline origin/staging..HEAD 2>/dev/null || git log --oneline -10`
- Files changed vs staging: !`git diff --stat origin/staging...HEAD 2>/dev/null | tail -20`

## Steps

1. **Lint**: `pnpm lint`
2. **Typecheck**: `pnpm exec tsc --noEmit`
3. **Unit tests + coverage**: `pnpm test:coverage`. CI fails below the 90%
   thresholds in `vitest.config.mts`; report the numbers for any file that drags them down.
4. **Integration**: `pnpm test:int` (needs the local Postgres). It rebuilds
   the test DB from migrations alone, so it also checks they're complete.
5. **End-to-end**: only if `$ARGUMENTS` contains `--e2e`, run `pnpm test:e2e`.
   WebKit doesn't install on this Mac, so run `--project=chromium` and the
   mobile projects in Chromium emulation; CI covers real WebKit.
6. **Commit messages**: every commit listed above must match
   `^(feat|fix|perf|refactor|docs|test|build|ci|style|chore|revert)(\([a-z0-9._/-]+\))?!?: .+`
   (merge/revert/fixup commits excepted). release-please ignores the rest,
   so the change would never reach the CHANGELOG.
7. **Migrations**: if the diff touches `src/collections`, `src/globals`,
   `src/fields` or `src/payload.config.ts` in a way that changes the DB shape,
   there must be a new file in `src/migrations/` registered in `index.ts`.
   If not, say so and suggest `/new-migration`.
8. **Generated files**: `git status --porcelain src/payload-types.ts` must be
   clean after `pnpm generate:types`.

## Report

A short table: step / ✅ or ❌ / one-line detail. Then remind that feature PRs
target `staging`, not `main`; the `staging → main` PR is the release.
