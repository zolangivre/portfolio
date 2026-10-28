---
name: ship-plan
description: Take one plan from plans/ through the whole agent loop (branch, tests first, implement, verify, independent review by subagents, fix, commit, retire the plan), then ship it with /ship — push, PR into staging, CI followed until green. With --local, stops before pushing. Never merges.
disable-model-invocation: true
argument-hint: <plan number, e.g. 007> [--local]
---

# Ship a plan

Arguments: `$ARGUMENTS`. Plan to ship: `plans/NNN-*.md`, `NNN` being the
number in the arguments. If there's none, list the plans whose Status isn't
DONE and ask which one. `--local` stops after the commit, before anything
leaves the machine. New plans start from
[plan-template.md](plan-template.md).

The loop is: **spec → tests → implement → verify → review → fix → deliver →
ship**. Tests and reviews are done by subagents with a fresh context, so they
judge against the plan, not your reasoning. The last step pushes the branch
and opens the PR into `staging`; the merge stays with Zolan.

`/plans` is gitignored: a plan exists nowhere but on this disk. That's why
step 7 copies what's worth keeping into the commit and `plans/README.md`
before deleting it.

## Context

- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | head -20`
- Plans: !`ls plans/`

## 0. Gate

Stop and report if any of these fail:

- The working tree is clean (the list above is empty).
- The plan file exists and its Status isn't DONE.
- The plan has a **Target** and a **Vérification** section. Without them
  there's nothing to check the work against.

Read `plans/README.md`: its **Décisions** are binding. If the plan contradicts
one, stop and ask. Then read the plan in full, and every file it names. If it
leaves a product or
design decision open (wording, a visual choice, a behaviour the plan doesn't
settle), ask before writing code. Don't guess on taste.

## 1. Branch

```sh
git switch staging && git pull --ff-only
git switch -c <type>/<NNN>-<short-slug>
```

`<type>` is the Conventional Commit type the change will ship under (`feat`,
`fix`, `perf`, `refactor`…). Set the plan's Status to `IN PROGRESS`, and add
its row to the **En cours** table of `plans/README.md` if it isn't there.

## 2. Tests first

Launch **test-writer** with the plan path. It writes tests from the Target
before any code exists, so they can't just mirror the implementation.

When it's done:

- `git status --porcelain` shows changes under `tests/` only. Revert anything else.
- Its new tests fail, each for the reason the plan describes. A test that
  already passes proves nothing: ask why, or drop it.
- Keep its "à vérifier à l'œil" list for the report.

Skip this step only for a change no test can observe (pure styling, copy):
say so in the report.

## 3. Implement

- Do what **Target** says, nothing more. Anything else you notice goes into
  the plan under **Hors périmètre**, not into the diff.
- Make test-writer's tests pass without editing them. If one is wrong
  (contradicts the plan), fix the test and say so in the report.
- If the Payload config changes shape, read and follow
  `.claude/skills/new-migration/SKILL.md` (it can't be invoked as a skill from
  here). The hooks already format files and regenerate `payload-types.ts`.

## 4. Verify

Run, and fix until green:

1. `pnpm lint`
2. `pnpm exec tsc --noEmit`
3. `pnpm test:coverage` (unit tests, 90% thresholds)
4. `pnpm test:int` if the diff touches the schema, access rules, hooks or migrations.
5. `pnpm test:dom`
6. Each new or changed e2e file: `pnpm test:e2e <file> --project=chromium`
   (WebKit doesn't install on this Mac; CI runs it).

If the same failure survives three attempts, stop and report it with the
output. Don't weaken a test to make it pass.

## 5. Review

Pick the reviewers from `git diff --name-only staging...HEAD` plus uncommitted files:

- **payload-reviewer** (back end): `src/collections`, `src/globals`,
  `src/fields`, `src/hooks`, `src/lib/access.ts`, `src/lib/actions`,
  `src/lib/queries`, `src/lib/cache.ts`, `src/migrations`,
  `src/payload.config.ts`, `src/proxy.ts`.
- **ui-reviewer** (front end): `src/components`, `src/app/(frontend)`, any
  `.css`, `src/lib/motion`, `src/lib/i18n`.
- **webkit-reviewer** (Safari / iOS, which only CI can run): the diff touches
  motion or view transitions, scrolling or shelves, the header or the mobile
  menu, a modal or the lightbox, video, focus handling, or CSS with
  `position`, `overflow`, `backdrop-filter`, viewport units or `:has()`.

Launch the ones that apply **in the same message** so they run in parallel.
They don't see this conversation, so each prompt says: the plan path, that the
base is `staging`, and that the change isn't committed yet (`git diff HEAD`
plus `git diff staging...HEAD`).

## 6. Triage and fix

For each finding, decide and note why:

- **Fix**: real, and inside the plan's scope.
- **Reject**: wrong (you can point to the code that shows it).
- **Defer**: real but out of scope. Add it to **Hors périmètre**.

Then rerun step 4. Run a second review round only for reviewers whose findings
you fixed, and stop there: two rounds at most.

## 7. Deliver and retire the plan

1. Read `.claude/skills/pre-pr/SKILL.md` and run its steps 1–4 and 6–8.
2. Copy into `plans/README.md`, under `## Backlog` (create it if missing):
   every **Hors périmètre** item and every deferred finding, each with its
   `file:line` and a one-line why. They outlive the plan.
3. Commit with a Conventional message (`feat(contact): …`). The body carries
   the plan, since the file is about to go: two or three lines on the Problem
   and the Target, the test files that prove it, and `Plan: NNN`.
   One commit unless the plan has clearly separate steps.
4. Once the commit has succeeded, delete the plan file and remove its row
   from the table in `plans/README.md`.
5. With `--local`, stop here. Otherwise read `.claude/skills/ship/SKILL.md`
   and follow it from step 4 (the checks and the commit are done): push, PR
   into `staging`, CI followed until it's green. The PR body carries the
   report's tests and its "check by eye" list. Called from `/feature`, skip
   this: `/feature` looks at the screens first, then ships.

## Report

- A table: phase / ✅ ❌ / one-line detail.
- Tests written: file, what each proves.
- Reviewer findings: fixed, rejected (why), deferred (now in the Backlog).
- What a person must still check by eye: animation feel, mobile on a real
  device, dark mode, both locales.
- The PR link and its CI state. With `--local`, say to run `/ship` when
  ready.
