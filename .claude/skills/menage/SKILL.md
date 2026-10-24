---
name: menage
description: Git housekeeping — local branches merged or orphaned, remote branches of merged PRs, abandoned worktrees (yours and the agents'), open PRs gone quiet. Shows the list and asks before deleting anything. Example: /menage, or /menage --dry-run for the inventory only.
disable-model-invocation: true
argument-hint: '[--dry-run]'
---

# Git housekeeping

Arguments: `$ARGUMENTS`. `--dry-run`: the inventory only, nothing is deleted.

Every `/feature`, `/bug` and `/ship` leaves a work branch behind, locally and
on GitHub (the repo doesn't delete branches on merge). This clears them once
their PR is merged, without ever losing work that isn't pushed.

## Never touched

- `main`, `staging`, and the **current branch**.
- The bots' branches, `dependabot/…` and `release-please--…`, and the
  sweep's `chore/security-sweep`: their workflows manage them.
- A branch with **commits on no remote branch**
  (`git log <branch> --not --remotes --oneline`): maybe unpushed work. Report
  it, don't delete it.
- A worktree with uncommitted changes (`git -C <worktree> status --porcelain`).
- PRs: reported, never closed by this skill.

## 1. Inventory

```sh
git fetch -q --prune origin
```

**Local branches** to offer:

- **merged** into `origin/staging` or `origin/main`:
  `git branch --merged origin/staging` (and `origin/main`);
- **merged on GitHub** although git doesn't see it (a squash or a rebase):
  `gh pr list --state merged --head <branch> --json number,mergedAt`. Its
  commits must also be pushed (rule above);
- **orphaned**: the remote branch is gone (`git branch -vv | grep ': gone]'`).
  Check a merged PR exists for it; otherwise treat it as unpushed work.

**Remote branches** to offer: heads of merged or closed PRs that still exist
on `origin`, bots' branches excepted.

```sh
gh pr list --state merged -L 200 --json headRefName --jq '.[].headRefName' | sort -u
gh pr list --state closed -L 200 --json headRefName,mergedAt --jq '.[] | select(.mergedAt == null) | .headRefName' | sort -u
git ls-remote --heads origin | awk '{print $2}' | sed 's#refs/heads/##'
```

A closed, unmerged PR's branch is offered with that said plainly: it may be
work set aside on purpose.

**Worktrees**: `git worktree list --porcelain`, including the agents' under
`.claude/worktrees/`.

- Those marked `prunable` (folder gone) go with `git worktree prune`.
- Those whose branch is merged are offered, after checking for local changes.

**Open PRs with no activity for more than 30 days**, bots excepted
(`gh pr list --state open --json number,title,updatedAt,author,headRefName`):
report only.

## 2. Confirm

One table, `category | name | why | last activity`, then ask with
`AskUserQuestion` (multiple choice) what to delete:

- local branches;
- remote branches;
- worktrees.

**With `--dry-run`, stop here.**

## 3. Delete

Only what was confirmed:

```sh
git branch -d <branch>                 # merged in git's sense
git branch -D <branch>                 # merged on GitHub only: PR merged and commits pushed
git push origin --delete <branch>      # remote branch
git worktree remove <path>             # worktree with no changes
git worktree prune
```

If `branch -d` refuses, git sees unmerged commits: don't force it without
checking the pushed-commits rule.

## Report

What was deleted, by category. What was kept and why (unpushed work, local
changes, a closed PR's branch). The quiet PRs to look at.
