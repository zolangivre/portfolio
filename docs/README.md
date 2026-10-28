# Docs

**English** · [Français](README.fr.md)

Everything in this repo that runs on its own or on a command: the Claude Code
setup, GitHub Actions and the git hooks. The site itself (stack, content
model, tests, deployment) is in the [main README](../README.md).

Every document exists in English and French (`<name>.fr.md`). CI fails a PR
that changes one language without the other: see
[the fr/en docs check](github/ci.md#docs-fren-in-sync).

## Map

### Claude Code: [`ai/`](ai/README.md)

| Document                                       | Covers                                                                                                                                       | Lives in                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Overview](ai/README.md)                       | How the pieces fit, what you still do by hand, the `plans/` folder, what uses your Claude quota                                              |                                                                                            |
| [Skills](ai/skills.md)                         | The 16 commands (`/feature`, `/ship`, `/bug`, `/release`…) and the 2 skills Claude loads on its own (`payload`, `i18n-copy`), grouped by use | [`.claude/skills/`](../.claude/skills/)                                                    |
| [Subagents](ai/subagents.md)                   | `test-writer`, `payload-reviewer`, `ui-reviewer`, `webkit-reviewer`: what each reads, who calls it                                           | [`.claude/agents/`](../.claude/agents/)                                                    |
| [Hooks and settings](ai/hooks-and-settings.md) | The 6 hooks that run around Claude's actions, permissions, `CLAUDE.md` / `AGENTS.md`, Codex, MCP servers                                     | [`.claude/settings.json`](../.claude/settings.json), [`.claude/hooks/`](../.claude/hooks/) |
| [Claude on GitHub](ai/github-agents.md)        | The PR review (`review` label) and the nightly security sweep: triggers, protections, setup, troubleshooting                                 | [`.github/workflows/`](../.github/workflows/)                                              |

### GitHub: [`github/`](github/README.md)

| Document                           | Covers                                                                                            | Lives in                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Overview](github/README.md)       | Branches (`staging`, `main`), the ruleset, secrets and settings, the PR template, troubleshooting | [`.github/`](../.github/)                                                                                                                             |
| [CI](github/ci.md)                 | `ci.yml` job by job, when the slow tests are skipped, the fr/en docs check, the schema drift test | [`ci.yml`](../.github/workflows/ci.yml), [`ci-site-changed.sh`](../.github/ci-site-changed.sh), [`check-doc-pairs.sh`](../.github/check-doc-pairs.sh) |
| [Dependabot](github/dependabot.md) | Weekly npm PRs, groups, the 3-day cooldown, what to run on each kind of PR                        | [`dependabot.yml`](../.github/dependabot.yml)                                                                                                         |
| [Releases](github/releases.md)     | release-please, version numbers from commits, the three merges of a release                       | [`release.yml`](../.github/workflows/release.yml), [`release-please-config.json`](../release-please-config.json)                                      |

### Git: [`git-hooks.md`](git-hooks.md)

The `commit-msg` hook that checks the Conventional Commits format, how it's
installed, and why nothing (you excepted) gets around it.

## Who runs what

| Trigger                               | What runs                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| You type a command in Claude Code     | A skill: [`/feature`, `/ship`, `/release`…](ai/skills.md)                                             |
| Claude edits a file or runs a command | The [Claude Code hooks](ai/hooks-and-settings.md#hooks): guard, format, types, related tests          |
| You (or Claude) commit                | The [`commit-msg` git hook](git-hooks.md)                                                             |
| Push or PR                            | [CI](github/ci.md); on a push to `staging`, [release-please](github/releases.md)                      |
| You add the `review` label to a PR    | [Claude's review](ai/github-agents.md#the-pr-review)                                                  |
| Every night, 00:17 UTC                | [The security sweep](ai/github-agents.md#the-security-sweep) (Claude only runs if the alerts changed) |
| Every Monday                          | [Dependabot's npm PRs](github/dependabot.md) (GitHub Actions: monthly)                                |
| Push to `staging` or `main`           | A Vercel deploy, which runs `payload migrate` first ([`vercel.json`](../vercel.json))                 |

Nothing in this list merges a PR, deploys by hand or writes to the production
CMS. Merging is always yours.
