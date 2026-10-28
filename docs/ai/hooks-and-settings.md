# Hooks and settings

**English** · [Français](hooks-and-settings.fr.md)

What runs around each of Claude's actions, what it may do without asking,
and the files that tell it about the repo. Back to the [overview](README.md).

- [Hooks](#hooks)
- [Permissions](#permissions)
- [Instruction files](#instruction-files): `CLAUDE.md`, `AGENTS.md`, Codex
- [MCP servers and connectors](#mcp-servers-and-connectors)
- [What lives outside the repo](#what-lives-outside-the-repo)

## Hooks

Declared in [`.claude/settings.json`](../../.claude/settings.json), scripts in
[`.claude/hooks/`](../../.claude/hooks/). Claude Code runs them, not Claude:
they apply whatever Claude was asked, in every session, bypass mode
included.

| When                      | Hook                                                          | Does                                                                                      |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Before a shell command    | [`guard-git.sh`](../../.claude/hooks/guard-git.sh)            | Refuses the git and `gh` commands that step outside branch → PR → CI → your merge         |
| Before an edit            | [`protect-files.sh`](../../.claude/hooks/protect-files.sh)    | Refuses edits to secrets, the lockfile, generated files and what release-please owns      |
| After an edit             | [`format.sh`](../../.claude/hooks/format.sh)                  | `eslint --fix`, then Prettier, on the edited file                                         |
| After an edit             | [`generate-types.sh`](../../.claude/hooks/generate-types.sh)  | Regenerates `src/payload-types.ts` after a schema edit                                    |
| After an edit             | [`turn-checks.sh record`](../../.claude/hooks/turn-checks.sh) | Notes the edited file for the end of the turn                                             |
| When Claude tries to stop | [`turn-checks.sh stop`](../../.claude/hooks/turn-checks.sh)   | Runs the tests related to the edited files, and checks these docs followed a setup change |

"Edit" means the `Edit`, `Write` and `MultiEdit` tools. A file changed
through a shell command (`sed`, a heredoc) goes through `guard-git` only.

How a hook answers: exit 0 lets the action through; a JSON
`permissionDecision: "deny"` (protect-files) or exit 2 (the others) blocks it
and sends the message, in French, back to Claude, which reads it and adjusts.
Every hook needs `jq`; without it, `guard-git` and `protect-files` block
rather than let everything through.

### `guard-git`

The ruleset on `staging` and `main` requires a PR and green CI, but
Repository admin is on its bypass list, and Claude's `gh` runs with your
admin token: `gh pr merge --admin` or a direct push would go through. This
hook is the barrier for Claude.

| Refused                                                                                                            | Instead                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `git push` to `main` or `staging`, without a named branch, to `HEAD`, with a wildcard refspec, `--all`, `--mirror` | `git push -u origin feat/<slug>`, then a PR                |
| `git push --force`, `-f`, `+refspec`                                                                               | `--force-with-lease`, after rebasing your own branch       |
| `gh pr merge`, the REST and GraphQL merge APIs, `merge-upstream`                                                   | You merge                                                  |
| A `gh api` write to `git/refs` (moving a branch without a PR)                                                      | A PR                                                       |
| `git commit --no-verify` / `-n`                                                                                    | A message the [`commit-msg` hook](../git-hooks.md) accepts |
| `git reset --hard`, `git clean -f`, `git checkout -f` / `-- .`, `git restore .`, `git switch --discard-changes`    | Ask you, or `git stash`                                    |
| `pnpm version` (and `npm`, `yarn`)                                                                                 | release-please sets the version                            |

It sees through wrappers (`env`, `sudo -u x`, `timeout -s KILL 30`,
`xargs -n 1`, `npx`, `pnpm --filter x exec`, `bash -c "…"`), joins lines cut
by `\`, sets heredoc bodies aside (a commit message that quotes
`gh pr merge` isn't a merge), and reads each command twice: split
everywhere, and split with its quoted strings set aside, so a `;` inside a
quoted argument can't hide the rest. Git accepts abbreviated options
(`--har`), so options are compared by prefix.

It guards against mistakes, not against a deliberate workaround: aliases,
variables, functions, `git -c core.hooksPath=…` and edits to the script
itself aren't covered. It was ported from memmi
(`memmi-front/.claude/hooks/guard-git.sh`): a parsing fix there likely
applies here too.

### `protect-files`

| File                                                         | Why, and the proper way                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `.env`, `.env.*` (not `.env.example`)                        | Secrets: you edit them yourself                          |
| `pnpm-lock.yaml`                                             | Generated: `pnpm add`, `pnpm remove`, `pnpm install`     |
| `src/payload-types.ts`                                       | Generated: change the schema, then `pnpm generate:types` |
| `src/app/(payload)/admin/importMap.js`                       | Generated: `pnpm generate:importmap`                     |
| `CHANGELOG.md`, `.release-please-manifest.json`              | release-please writes them from the commit messages      |
| The `version` field of `package.json` (the rest is editable) | release-please bumps it in its version PR                |

### `format`

On a `.ts`, `.tsx`, `.js`, `.mjs` or `.cjs` file: `eslint --fix`, then, on any
file, Prettier with the repo's config (`--ignore-unknown` skips types it has
no parser for, and `.prettierignore` still applies: `src/migrations/index.ts`
keeps Payload's style). Lint errors left after `--fix` go back to Claude, so
they never wait for CI; warnings pass. One hook rather than two: Claude Code
runs a tool's hooks in parallel, and two scripts rewriting the same file
would race.

### `generate-types`

Only for files that feed the Payload config: `src/collections/`,
`src/globals/`, `src/fields/`, `src/payload.config.ts`. It runs
`pnpm generate:types`, so CI's typecheck never sees stale types. If
generation fails, the error goes back to Claude so it fixes the config.

### `turn-checks`

`record` notes each file Claude edits during a turn. `stop` runs when Claude
tries to end its turn:

1. **Related tests**: `vitest related` on the unit and dom projects for the
   edited source and test files. Fast, no database; the full suites stay
   with `/pre-pr` and CI.
2. **These docs**: if the turn changed `.claude/skills/`, `.claude/agents/`,
   `.claude/hooks/` or `.claude/settings.json` (the `payload` skill
   excepted) and no file in `docs/ai/` changed in the same turn, Claude is
   asked to check them, in both languages. If the change doesn't affect what
   they describe, it says so and stops.

A failure on the first stop sends Claude back to work. On the second, it's
only reported: no loop. The state lives in a private directory under
`$TMPDIR`. To turn it off for your sessions, set `CLAUDE_TURN_CHECKS=off` in
the `env` of `.claude/settings.local.json`.

## Permissions

[`.claude/settings.json`](../../.claude/settings.json) is shared and
committed. It allows, without a prompt, the read-only or local commands every
workflow uses:

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm exec prettier`
- `pnpm generate:types`, `pnpm generate:importmap`
- `pnpm test:unit`, `pnpm test:int`, `pnpm test:coverage`
- `pnpm payload migrate:status`
- `gh pr view`, `gh pr checks`, `gh run view`, `gh run list`, `gh run watch`

Everything else asks, unless you allowed it in `.claude/settings.local.json`:
your own file, ignored by your global gitignore, for personal permissions,
extra directories, plugins and `env` (like `CLAUDE_TURN_CHECKS`). An allow
rule never overrides a hook: `guard-git` refuses a push to `staging` even in
bypass mode.

The GitHub workflows don't rely on these lists: each passes its own exact
`--allowedTools` and `--disallowedTools` (see
[Claude on GitHub](github-agents.md#what-protects-these-workflows)).

## Instruction files

| File                           | Tracked                     | Read by                                   | Says                                                                                                                                                     |
| ------------------------------ | --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](../../CLAUDE.md) | yes                         | Claude Code                               | Use the `payload` skill in `.claude/skills/payload/`                                                                                                     |
| `AGENTS.md`                    | no (gitignored)             | Codex, and the skills that say to read it | The Payload skill for Codex, and the block `next dev` writes: this Next.js version differs from training data, read `node_modules/next/dist/docs/` first |
| `.codex/config.toml`           | no (gitignored)             | Codex                                     | The chrome-devtools MCP server                                                                                                                           |
| `.agents/skills/payload/`      | no (gitignored)             | Codex                                     | A copy of `.claude/skills/payload/`                                                                                                                      |
| `plans/README.md`              | no (`plans/` is gitignored) | `/feature`, `/ship-plan`, the agents      | Binding **Décisions**, the **Backlog**, plans in progress                                                                                                |

`next dev` rewrites its block into `AGENTS.md` on every start: removing it
from a diff only brings it back.

The GitHub review deletes the PR's copies of every `CLAUDE.md`, `AGENTS.md`
and `.claude/` and takes them from `staging`, so a PR can't rewrite the
rules of its own review.

## MCP servers and connectors

None is configured in the repo (no `.mcp.json`). The skills use, when
they're connected in your session:

| Server                         | Used by                                                    | For                                                           |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| chrome-devtools                | `/audit`, `/site-health`, `/preview-check`, `/triage-deps` | Pages, emulation, screenshots, Lighthouse, performance traces |
| The claude.ai Vercel connector | `/release`, `/site-health`, `/preview-check`, `/bug`       | Deployments, build logs, runtime errors and logs, page views  |
| postgres (read-only, local)    | `/new-migration`                                           | Reading the live local schema instead of guessing             |
| GitHub, through `gh`           | almost all                                                 | PRs, checks, runs, releases, alerts                           |

A skill whose server isn't connected says so and skips that step, rather
than guessing.

## What lives outside the repo

Not in git, so not documented here in detail: your user-level skills
(`~/.claude/skills/`, `zolan-profile` among them, which `/content-audit`
uses), plugins, your memory, and MCP servers configured in `~/.claude.json`.
A fresh clone gets the hooks, the shared permissions, the skills and the
agents, and nothing personal.
