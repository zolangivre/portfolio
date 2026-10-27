# Git hooks

**English** · [Français](git-hooks.fr.md)

The hooks git itself runs, in [`.githooks/`](../.githooks/). Not to be
confused with the [Claude Code hooks](ai/hooks-and-settings.md#hooks), which
Claude Code runs around Claude's actions. Back to the [docs index](README.md).

There is one: `commit-msg`.

## `commit-msg`

[`.githooks/commit-msg`](../.githooks/commit-msg) checks that the first line
of every commit message follows [Conventional Commits](https://www.conventionalcommits.org).
release-please derives the version number and the CHANGELOG from those
messages ([Releases](github/releases.md)): a malformed one would be ignored,
and its change would show up in no release.

```txt
<type>(<optional scope>)<optional !>: <description>
```

| Part        | Allowed                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| type        | `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `style`, `chore`, `revert`             |
| scope       | lower case letters, digits, `.`, `_`, `/`, `-`: `feat(journal)`, `chore(deps-dev)`, `ci(security-sweep)` |
| `!`         | a breaking change: the next release is a major                                                           |
| description | anything, after `: `                                                                                     |

The exact pattern:

```txt
^(feat|fix|perf|refactor|docs|test|build|ci|style|chore|revert)(\([a-z0-9._/-]+\))?!?: .+
```

**Let through** without a check, since git writes them itself: messages
starting with `Merge `, `Revert `, `fixup! `, `squash! ` and `amend! `.

A refused commit prints the line it got, the expected shape, the types and
an example, and the commit doesn't happen: fix the message and commit again.

```txt
✖ Commit message is not in Conventional Commits format:
    Update stuff
  Expected: <type>(<optional scope>): <description>
  Types   : feat, fix, perf, refactor, docs, test, build, ci, style, chore, revert
  Example : feat(journal): reading progress bar
```

Only the first line is checked. The body is free: say why there, and put
`BREAKING CHANGE: …` in it for a major, or `Docs-Sync: skip` for a one-sided
docs change ([CI](github/ci.md#docs-fren-in-sync)).

## Installation

Git doesn't read hooks from the repo by default. The `prepare` script in
`package.json` points it there:

```json
"prepare": "git config core.hooksPath .githooks || true"
```

`pnpm install` runs `prepare`, so a clone is set up as soon as its
dependencies are installed. `|| true` keeps an install outside a git
checkout from failing. To check, or to set it by hand:

```sh
git config core.hooksPath   # .githooks
git config core.hooksPath .githooks
```

The hook must stay executable (`chmod +x .githooks/commit-msg`): git
silently skips a hook that isn't.

## Who it applies to

| Who                       | Checked | How                                                                                                                                                 |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| You, locally              | yes     | after `pnpm install`                                                                                                                                |
| Claude, locally           | yes     | and [`guard-git`](ai/hooks-and-settings.md#guard-git) refuses `git commit --no-verify` / `-n`                                                       |
| The security sweep on CI  | yes     | it installs with `--ignore-scripts`, which skips `prepare`, so the workflow sets `core.hooksPath` itself, and its command list denies `--no-verify` |
| Dependabot                | no      | its commits are made on GitHub, but its `chore(deps)` and `ci` prefixes are Conventional ([Dependabot](github/dependabot.md))                       |
| release-please            | no      | it writes `chore(staging): version X.Y.Z` itself                                                                                                    |
| Merge commits from GitHub | no      | `Merge pull request #…`, let through by the hook anyway                                                                                             |

`/pre-pr` checks every commit of the branch against the same pattern, which
catches anything committed before the hook was installed.

## Bypassing it

For a one-off, you can: `git commit --no-verify`. Claude can't, locally
(`guard-git`) or on CI (the sweep's deny list). A commit that skipped the
hook still has to be Conventional to appear in a release, so reword it
before it's pushed (`git commit --amend`, or an interactive rebase).

## Adding a hook

Put an executable script named after the git hook (`pre-push`,
`pre-commit`…) in `.githooks/`. It applies to every clone after its next
`pnpm install`. Keep hooks fast and POSIX `sh`, like `commit-msg`: they run
on every commit, the agents' included.
