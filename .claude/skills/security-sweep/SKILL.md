---
name: security-sweep
description: Clear what Dependabot and CodeQL leave open (alerts on transitive dependencies, code scanning alerts, Dependabot PRs with red CI). Fixes what can be fixed on one branch, proposes a reasoned dismissal for the rest, verifies, and with --pr opens or updates a single PR against staging. Never merges, never dismisses.
disable-model-invocation: true
argument-hint: '[--pr]'
---

# Security sweep

Dependabot opens version PRs on its own (`.github/dependabot.yml`). Three
kinds of problem are left over, and they're what this sweep handles:

- alerts on **transitive** dependencies whose parent pins a vulnerable range.
  Dependabot can't bump those, so they stay open forever;
- **CodeQL** alerts: it reports them, it doesn't fix them;
- **Dependabot PRs with red CI**: an update that needs a code change.

Mode: if `$ARGUMENTS` contains `--pr`, push and open or update the PR (this is
how `.github/workflows/security-sweep.yml` runs it). Otherwise stop after the
commits, like `/ship-plan`.

## 0. Collect

If `.security/` already exists (CI fetched it before you started), read it.
Otherwise run `sh .claude/skills/security-sweep/fetch-alerts.sh .security`.
You get `dependabot-alerts.json`, `code-scanning-alerts.json` and
`dependabot-prs.json` (open Dependabot PRs with a failed check). If all three
are empty, say so and stop.

Then set up the branch. There is only ever one sweep PR:

- The working tree must be clean (`.security/` is gitignored).
- If `gh pr list --head chore/security-sweep --state open` finds a PR, check
  out that branch and rebase it on `origin/staging`. You update it, you never
  open a second one.
- Otherwise: `git switch staging && git pull --ff-only && git switch -C chore/security-sweep`.

## 1. Triage

### Dependabot alerts

Group them by package: one package often has many alerts. For each package,
find what pulls it in (`pnpm why <pkg> --depth 3`) and take the target
version: the highest `patched` across its open alerts. Then decide, in this order:

1. **Bump the direct parent** if a newer version of it, still within its range
   in `package.json`, pulls the patched version: `pnpm update <parent>`.
   Exception: `payload`, `@payloadcms/*`, `next`, `react`, `react-dom` and
   their types are pinned exactly and move together in Dependabot's
   `payload-next-react` PR. Never bump them here. If only that bump fixes an
   alert, mark it **waiting for payload-next-react**.
2. **Override** in `package.json` → `pnpm.overrides`, scoped to the vulnerable
   range so that other copies don't move: `"undici@<7.29.1": "^7.29.1"`. Only
   within the major that's installed. Crossing a major isn't an override, it's
   a change to report. `package.json` can't hold comments, so the reason
   (package, GHSA, which parent pins it) goes in the commit body and the PR
   table. Also drop any existing override the tree no longer needs.
3. **No fix possible**: `patched` is null, or the fix crosses a major. Change
   nothing and write a **dismissal proposal**: where the code runs (`next dev`
   only, build, admin panel, public site, server), whether the vulnerable code
   path is reachable from input someone controls, and the GitHub reason
   (`not_used`, `tolerable_risk`, `inaccurate`, `no_bandwidth`, `fix_started`).

### Code scanning alerts

Read the rule, its description and the flagged `path:line`, and make the
smallest change that satisfies the rule. For example,
`actions/missing-workflow-permissions` needs a least-privilege `permissions:`
block, granting each job only what its steps use. A false positive gets a
dismissal proposal (`false positive`, `won't fix`, `used in tests`) with the reason.

### Red Dependabot PRs

Find why: `gh run list --branch <branch>`, then `gh run view <id> --log-failed`.

- **Small code change needed** (a renamed API, a stricter type): check out the
  Dependabot branch, fix it, run step 3, and push a
  `fix(deps): adapt to <pkg> <version>` commit to that branch. Dependabot
  stops rebasing a PR once someone else pushes to it; that's expected.
- **Big change** (a major with a migration guide, a Payload schema change):
  don't fix. Comment on the PR with the failing job, the error, the change
  needed, and suggest turning it into a plan.
- **Unrelated or flaky failure**: rerun once (`gh run rerun <id> --failed`) and note it.

## 2. Apply and prove

- After any `package.json` change, run `pnpm install`. The lockfile is
  generated, and the hooks won't let you edit it by hand.
- Proof that a dependency alert is fixed: `pnpm why <pkg>` lists no installed
  version inside the alert's `vulnerable` range. Put that line in the PR table.

## 3. Verify

1. `pnpm lint`
2. `pnpm exec tsc --noEmit`
3. `pnpm test:coverage`
4. `pnpm test:int` (needs Postgres: Docker locally, a service in CI)
5. `pnpm build` only if an override touches build tooling (postcss, sass,
   esbuild, browserslist, swc). Otherwise the PR's e2e job builds the site anyway.

If one item keeps failing after three attempts, revert that item alone, list
it as **not fixed** with the error, and carry on with the others. One bad item
mustn't block the rest.

## 4. Review

If the diff touches `src/`, launch **payload-reviewer** and/or
**ui-reviewer** as `/ship-plan` does, in parallel. If it touches
`.github/workflows/`, check yourself that no job gained a permission its
steps don't use.

## 5. Commit

One commit per kind of fix, Conventional format:

- `fix(deps): patch <pkg> to <version>`, with the GHSA ids and the parent that
  pinned it in the body. `fix` makes release-please ship a patch release.
- `ci: …` or `fix(<scope>): …` for code scanning fixes, with the rule id in the body.

## 6. Deliver

- Without `--pr`: stop here and print the report.
- With `--pr`: `git push --force-with-lease -u origin chore/security-sweep`,
  write the report to `.security/pr-body.md`, then
  `gh pr create --base staging --title "fix(deps): security sweep" --body-file .security/pr-body.md`
  or, if the PR exists, `gh pr edit chore/security-sweep --body-file .security/pr-body.md`.

## Report (also the PR body)

1. One line: N alerts seen, how many fixed, proposed for dismissal, waiting, not fixed.
2. A table: alert numbers / package or rule / severity / action (bump,
   override, code fix, waiting, dismissal proposed, not fixed) / proof.
3. Dismissal proposals, each with its reason and the exact command for a
   person to run:
   `gh api -X PATCH repos/{owner}/{repo}/dependabot/alerts/<n> -f state=dismissed -f dismissed_reason=<reason> -f dismissed_comment="<why>"`
   (`code-scanning/alerts/<n>` with `dismissed_reason` for CodeQL).
4. Red Dependabot PRs: what was done on each.
5. A reminder that Dependabot alerts are computed on `main`: they close once
   the fix ships in the `staging → main` release, not when this PR merges.

## Never

- Merge a PR, dismiss an alert, or push to `staging` or `main`.
- Edit `.env*`, or change the versions of the `payload-next-react` group.
- Add an override that crosses a major, or commit with `--no-verify`.
