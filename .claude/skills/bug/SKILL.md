---
name: bug
description: Fix a bug by reproducing it first with a failing test, then root cause, minimal fix, green test, checks, independent review, a fix() commit and a PR into staging with CI followed. Never merges. Example: /bug the project dates show a month early on Vercel.
disable-model-invocation: true
argument-hint: <the bug, an error message, a URL…>
---

# Bug: $ARGUMENTS

A bug is fixed when **a test that reproduced it passes**. Without that test,
nobody knows it's fixed, or that it won't come back.

This follows `/feature` (`.claude/skills/feature/SKILL.md`) with two
differences: you reproduce **before** you fix, and the plan goes to Zolan
only if the fix grows (step 4). Read `CLAUDE.md` and `AGENTS.md`.

## Context

- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | head -20`

## 1. Understand

- Restate the bug in one sentence: what happens, what should, and where
  (page, locale, light or dark, phone or desktop, visitor or admin).
- Something is missing and nothing lets you find it (the exact page, the
  error, the content that triggers it): ask with `AskUserQuestion`.
- A production URL is given: look at it read-only (browser or `curl`).
  Server errors are in the Vercel runtime logs, through the Vercel connector
  if it's connected (`get_runtime_errors`, then `get_runtime_logs`). Never
  log in to the production admin, never submit its forms.

## 2. Branch

Same gate as `/feature` (clean working tree, or ask). Then:

```sh
git fetch origin staging
git switch -c fix/<slug> origin/staging
```

**Hotfix**: the bug is in production and `staging` holds changes that
mustn't ship yet. Ask Zolan first. Then branch from `origin/main`, open the
PR into `main`, and say in the report that `main` must be merged back into
`staging` afterwards.

## 3. Reproduce with a failing test

Pick the lowest layer that reproduces it (the table in
`.claude/agents/test-writer.md` describes each):

| Where the bug lives                                                      | Test                                    |
| ------------------------------------------------------------------------ | --------------------------------------- |
| pure logic: dates, formatting, `src/lib`, `src/proxy.ts`, sitemap        | unit, `tests/unit/`                     |
| Payload: access rules, hooks, schema, queries against the DB, migrations | int, `tests/int/` (local Postgres)      |
| one component's state, ARIA, keyboard                                    | dom, `tests/dom/` (Testing Library)     |
| a visitor flow, navigation, server rendering, cache after a save         | e2e, `tests/e2e/`, `--project=chromium` |

Run it and check it **fails for the bug's reason**, not because of a setup
mistake.

**Can't reproduce**: don't invent a fix. Say what you tried and what you'd
need to know, then stop.

## 4. Root cause

- Fix the cause, not the symptom. "A date shows a month early" is almost
  always a date read in the server's time zone, not the display. Dates here
  are stored at noon UTC and read in UTC (`src/lib/dates.ts`).
- Look for the same pattern elsewhere (`grep`): the same bug often lives in
  other files. The sure ones go into this fix, each with its test. The rest
  goes in the report.
- **The fix grows**: a schema change and its migration, more than a handful
  of files, a cache tag change, or a behaviour choice. Then stop and submit a
  plan in plan mode (`EnterPlanMode`, then `ExitPlanMode`), as `/feature`
  does. Otherwise, go on.

## 5. Fix

The smallest change that makes the test pass, in the project's conventions.
Then:

- the step 3 test passes;
- the related tests pass;
- with the fix removed, the test fails again: proof it really covers it. Put
  the fix back.

## 6. Checks, review, ship

- Checks: `.claude/skills/pre-pr/SKILL.md` steps 1–4, 7 and 8, fixing what
  fails (three attempts at most on the same failure, then stop and explain).
- Review: launch **payload-reviewer** and/or **ui-reviewer** on the diff, as
  in step 5 of `.claude/skills/ship-plan/SKILL.md`, with the bug in two
  lines instead of a plan path. Fix what's real.
- If the bug showed on the site, look at the fixed screen as in step 3 of
  `/feature`.
- Ship: `.claude/skills/ship/SKILL.md` from step 3. The commit is a
  `fix(<scope>): …` and will be in the changelog. Its body says **the cause**,
  not just the symptom, and names the test that guards it.

## Report

The bug in one sentence, its cause, the test that reproduces it, the PR link
and its CI state. Add the occurrences of the same pattern left out of the
fix, and, for a hotfix, the merge back into `staging` to do.
