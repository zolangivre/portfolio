---
name: ship
description: Ship the work in progress — checks, Conventional Commits, push of a work branch, a PR into staging, then follow GitHub CI until it's green, fixing what fails. Never merges. Called at the end of /feature, /ship-plan and /upgrade-payload, or on its own.
disable-model-invocation: true
argument-hint: '[--draft]'
---

# Ship the work in progress

Arguments: `$ARGUMENTS`. `--draft` opens the PR as a draft.

Running `/ship` is asking for the commits, the push and the PR. Zolan reviews
and merges every PR into `staging`, then ships `staging → main` with
`/release`. Your job ends at a PR whose CI is green.

## Context

- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | head -30`
- Commits not on origin/staging: !`git log --oneline origin/staging..HEAD 2>/dev/null | head -20`

## 1. Branch

- On `staging` or `main` with changes: create the work branch and keep them,
  `git switch -c <type>/<slug>`. `<type>` is the Conventional type the work
  ships under (`feat`, `fix`, `perf`, `refactor`, `docs`, `chore`, `ci`…),
  `<slug>` a short kebab-case ASCII summary. Never commit on `staging` or
  `main`.
- Local commits on `staging` that aren't on `origin`: same command, the
  branch starts at them. Say in the report that local `staging` is ahead of
  `origin/staging`; don't reset it (the guard refuses `reset --hard`, and the
  call is Zolan's).
- Already on a work branch: stay on it.
- Nothing to ship (clean tree, no commit ahead of `origin/staging`): stop and
  say so.
- The changes mix unrelated work (say, a fix and an agent setup change):
  ship them as separate branches and PRs. Commit the first on its branch,
  push it and open its PR (steps 3–5), then `git switch staging`, which
  carries the remaining uncommitted changes, and start again at step 1.
  Ask Zolan first if the split isn't obvious from the files.

## 2. Checks

Skip what already ran green since the last edit (in `/ship-plan` or
`/feature`, it has). Otherwise read `.claude/skills/pre-pr/SKILL.md` and run
its steps 1–4, 7 and 8, plus, for each e2e spec the change adds or touches,
`pnpm test:e2e <file> --project=chromium`. Here you **fix** failures: three
attempts at most on the same failure, then stop and explain. Never weaken a
test to make it pass.

A change to `src/collections`, `src/globals`, `src/fields` or
`payload.config.ts` that changes the DB shape needs its migration: read and
follow `.claude/skills/new-migration/SKILL.md`.

## 3. Commits

PRs are merged with a merge commit, so every commit lands in `staging` as is,
and release-please builds `CHANGELOG.md` from them: `feat`, `fix`, `perf`,
`refactor` and `revert` are listed, `feat!` bumps the major. A commit is a
unit that makes sense to someone reading the changelog.

- One commit per logical unit, its tests with it. Usually one `feat(<scope>)`
  or `fix(<scope>)`, plus a separate `docs`, `test`, `chore` or `refactor`
  when there's one.
- Add files by path (`git add <paths>`), never `-A` or `.`. Read
  `git status` first: no `.env*`, `coverage/`, `playwright-report/`,
  `test-results/`, screenshots or temp files. `plans/` is gitignored. The
  block `next dev` writes into `AGENTS.md` goes in with your work (see
  `AGENTS.md`).
- Messages in **English**, Conventional Commits (the `commit-msg` hook checks
  it; never bypass it). Reuse the scopes from `git log --format=%s -40`
  (`ui`, `contact`, `journal`, `admin`, `agents`, `security-sweep`, `deps`…).
  Subject in the imperative, lower case, no final period. The body says
  **why** and what isn't obvious, not the list of files.
- A change to `docs/<name>.md` goes with `docs/<name>.fr.md`, and the other
  way round: CI fails a PR that changes one language only.
- End the message with the attribution lines the environment provides, if
  any. Pass it through a heredoc: `git commit -F - <<'EOF' … EOF`.

## 4. Push

```sh
git push -u origin <branch>
```

Always with the branch name: the `guard-git` hook refuses a push without one,
to `main` or `staging`, or forced. After rebasing your own branch only:
`--force-with-lease`.

## 5. PR

If the branch already has a PR (`gh pr view <branch> --json number,url`),
don't open another: update its body if the scope changed
(`gh pr edit <n> --body-file …`) and go to step 6. A Dependabot PR is one of
these: push to its branch, leave its body alone.

Otherwise:

```sh
gh pr create --base staging --head <branch> --title "<title>" --body-file <file>
```

- `--draft` if `$ARGUMENTS` has it.
- **Title**: Conventional, like the main commit.
- **Body**, written to a file in the scratchpad (not `/tmp`), in English,
  short, following `.github/pull_request_template.md` (its comments removed):
  - **What and why**: a few sentences for someone who didn't follow the
    session;
  - **Tests**: what actually ran here, and the result;
  - **To check by eye**: what no test covers (animation feel, mobile on a
    real phone, dark mode, both locales, Safari). Screenshots: `gh` can't
    upload images, so list the local paths and tell Zolan to drag them in;
  - **Notes for the merge**: a migration Vercel will run on deploy, an env var
    to add, a review finding left open. "None" if none;
  - the attribution line for PRs the environment provides, if any.
- **The repository is public.** Nothing private in the title, body or
  commits: no secret, token or `.env` value, no personal data, no admin URL,
  and nothing about a vulnerability that isn't fixed yet (Dependabot and
  CodeQL alerts are private; see `/security-sweep`).
- Don't add the `review` label: it runs the same reviewers again on CI and
  spends the Claude quota. Zolan adds it when a second pass is wanted.

## 6. GitHub CI

Follow the checks **in the background** (`run_in_background`); you're told
when they end, and e2e takes several minutes:

```sh
gh pr checks <n> --watch --interval 30 >/dev/null 2>&1; code=$?; gh pr checks <n>; echo "exit=$code"
```

Don't pipe `--watch` (`| tail`): the exit code read would be the last
program's, and a failure would pass for a success. The final list decides:
every job must be `pass` or `skipping`. The required ones are Changes, Lint &
typecheck, Unit tests, Integration tests, E2E tests and Docs fr/en in sync.

On a failure:

1. `gh run view <run-id> --log-failed | grep -iE -m20 "error|failed|✘|expected"`:
   find the cause (the last lines are often just a repeated stack).
2. Likely infrastructure (font download, npm registry, network timeout,
   runner) **and** the same job green on `staging` for the same app code
   (`gh run list --workflow ci.yml --branch staging -L 5`): rerun it once
   (`gh run rerun <run-id> --failed`) and follow it with
   `gh run watch <run-id> --exit-status`. If it fails again, it's real.
3. Cause in the branch: fix it, rerun the matching check locally, commit,
   push, follow again. The fix commit takes the type that describes it
   (`test`, `refactor`, `style`, `chore`…), not `fix`: it repairs nothing
   that shipped, and a `fix` would show up in the changelog.
   The fix makes the code right, never the check weaker: no `.skip` or
   `.only`, no retries or longer timeout, no looser assertion, no
   `@ts-ignore`, `@ts-expect-error`, `eslint-disable` or `any` to silence an
   error, no edit to a lint, tsconfig, Vitest, Playwright or CI config to
   get past it. When the test itself is wrong (it asserts the old behaviour
   the branch meant to change), update it and say why in the commit body. If
   weakening the check is the only way through, stop and ask.
4. Cause outside the branch and lasting (a vulnerable dependency the branch
   doesn't touch, an unrelated flaky test, a failure that survives the
   rerun): don't fix it here. Report it and suggest a separate PR.
5. Three rounds without success: stop and explain what you tried.

Never merge (`guard-git` refuses `gh pr merge` and the merge API): the merge
is Zolan's.

## Report

For each PR:

- the link, and the CI state (✅, or ❌ and the cause);
- what Zolan still has to do: review, check by eye what the PR lists, drag
  in the screenshots, merge into `staging`. When enough has piled up on
  `staging`, `/release` opens the `staging → main` PR;
- anything noticed along the way and left out of scope.
