---
name: feature
description: Take a request from words to a PR with green CI — framing, a plan Zolan approves, tests first, implementation, checks, a look at the screens, independent review, commits, PR into staging and CI follow-up. Never merges. Example: /feature add a reading time to journal cards.
disable-model-invocation: true
argument-hint: <what you want, in plain words>
---

# Feature: $ARGUMENTS

Take the request to an open PR whose CI is green. **Zolan steps in twice
only**: to approve the plan (step 1), and to review and merge the PR. In
between, go on without asking for confirmation, except for a real blocker
(see "When to stop and ask").

The work itself runs through the existing loops, which you read and follow
(they're user-invoked skills, so they can't be invoked from here):
`/ship-plan` builds the change from a plan, `/ship` delivers it.

Keep a task list (steps 0 to 4) and update it as you go.

## Context

- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | head -20`
- Plans: !`ls plans/`

## 0. Gate

- The working tree must be clean (`plans/` is gitignored, so plans don't
  count). If it isn't, stop and ask what to do with those changes: ship them
  first with `/ship`, or leave them. Never set them aside yourself (`stash`,
  `reset`, `checkout`).
- `git fetch origin staging`.

## 1. Frame and plan

1. Read `CLAUDE.md`, `AGENTS.md`, and the **Décisions** in
   `plans/README.md`: they're binding. Explore the code closest to the
   request; the screen or collection that looks most like it is your model.
   If the exploration spans many files, hand it to an `Explore` agent and
   keep only its conclusions.
2. A real ambiguity (expected behaviour, wording, a visual choice, who sees
   what): ask with `AskUserQuestion`, one to three questions, your
   recommendation first. Don't ask what the code or the conventions already
   settle. Don't guess on taste.
3. Write the plan to `plans/NNN-<slug>.md` from
   `.claude/skills/ship-plan/plan-template.md`. `NNN` is the next free number:
   above every file in `plans/` and every `Plan: NNN` in
   `git log --grep '^Plan: ' --format=%B`. The **Target** (exact values,
   labels in fr **and** en) and **Vérification** sections are what the work
   is checked against. **Décisions ouvertes** must be empty once step 2's
   answers are in.
4. Submit it in **plan mode** (`EnterPlanMode`, then `ExitPlanMode` with the
   plan's content, its path, and the risks: schema change and migration,
   cache tags, SEO, both locales). Without approval, change nothing. If Zolan
   amends it, update the file before going on.

## 2. Build

Read `.claude/skills/ship-plan/SKILL.md` and follow its steps 0 to 7 for
plan `NNN`: branch from `staging`, tests first by test-writer, implement,
verify, review by payload-reviewer / ui-reviewer, triage, commit and retire
the plan. Skip its final "stop": this skill goes on.

## 3. Look at it

If the change shows on the site (`src/components`, `src/app/(frontend)`,
CSS, copy in the dictionary or the CMS fields it renders):

1. Run the site on the branch. `:3000` may already belong to a running dev
   server or Docker container: check with `lsof -iTCP:3000 -sTCP:LISTEN`, and
   use `pnpm dev -p 3100` if it's taken. Don't stop a server you didn't
   start.
2. Look at every screen the change touches at 390px and 1280px, in light and
   dark mode, in fr and en. Use the browser tools if they're connected,
   otherwise Playwright's Chromium from `node_modules` (WebKit doesn't
   install on this Mac). Keep one screenshot per screen in the scratchpad
   for the PR.
3. Something wrong: fix it, rerun the checks it affects, and fold the fix
   into the commit while it's unpushed (`git commit --amend --no-edit`).
4. Stop the server you started.

Skip this step for a change that shows nowhere (back end only, CI, docs) and
say so in the report.

## 4. Ship

Read `.claude/skills/ship/SKILL.md` and follow it from step 3 (the checks
just ran): commits if anything is still uncommitted, push, PR into `staging`
with the screenshots from step 3, CI followed until it's green.

## Final report

A few lines:

- the PR link and its CI state;
- what the review fixed, rejected (why) and deferred to the Backlog;
- what Zolan still has to check by eye, and the screenshots to drag into the
  PR;
- anything noticed nearby and left out of scope;
- then: review, merge into `staging`, and `/release` when it's time to ship
  to production.

## When to stop and ask

- The working tree isn't clean at the start.
- The plan no longer holds: a migration or a schema change it didn't plan
  for, a product or design choice it didn't settle.
- Three attempts without success on the same failure, locally or on CI.
- Anything outside the loop: touching `main` or `staging`, secrets, the
  production CMS or database, deployments, Vercel settings. `guard-git`
  refuses some of it; for the rest, you stop.
