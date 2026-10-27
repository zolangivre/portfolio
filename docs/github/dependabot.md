# Dependabot

**English** · [Français](dependabot.fr.md)

[`.github/dependabot.yml`](../../.github/dependabot.yml): which dependency
PRs open on their own, and what to do with each. Back to [GitHub](README.md).

Dependabot opens PRs; it never merges one. Each PR is checked by
[CI](ci.md) like any other, and waits for you.

## Two ecosystems

| Ecosystem      | When         | Target    | Commit prefix                          | At most        |
| -------------- | ------------ | --------- | -------------------------------------- | -------------- |
| npm            | Every Monday | `staging` | `chore(deps): …`, `chore(deps-dev): …` | 5 open PRs     |
| GitHub Actions | Every month  | `staging` | `ci: …`                                | one grouped PR |

Both prefixes are Conventional Commits, so the [`commit-msg` hook](../git-hooks.md)
and release-please treat Dependabot's commits like yours. A `chore` stays out
of the CHANGELOG; the security sweep's `fix(deps)` commits ship a patch
release.

**GitHub Actions** matters more than it looks: the two Claude workflows and
release-please pin every action to a commit SHA (a tag can be moved to any
code), and Dependabot is what keeps those SHAs and their `# vX.Y.Z` comments
current.

## Cooldown

A new version is only proposed once it has been on the registry for **3
days**. A compromised release (a supply-chain attack) is usually pulled
before then. Security updates aren't delayed.

The same delay applies to installs done by Claude: `/security-sweep`,
`/triage-deps` and `/upgrade-payload` pass `--config.minimum-release-age=4320`
(minutes) to `pnpm`.

## Groups

A package goes into the **first** group it matches. Scoped packages are
matched with `@scope*`: the `@scope/*` form matched nothing here (#51 bumped
`tailwindcss` without `@tailwindcss/postcss`, #77 `vitest` without
`@vitest/coverage-v8`, #76 `payload` without `@payloadcms`).

| Group                | Packages                                                                                                                    | Why together                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `payload-next-react` | `payload`, `@payloadcms*`, `next`, `@next*`, `eslint-config-next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` | Every `@payloadcms/*` package must match `payload`'s exact version, and Payload only accepts some Next/React versions. Majors included |
| `vitest`             | `vitest`, `@vitest*`                                                                                                        | The coverage plugin must match the runner. Majors included                                                                             |
| `tailwind`           | `tailwindcss`, `@tailwindcss*`                                                                                              | The PostCSS plugin must match. Majors included                                                                                         |
| `minor-and-patch`    | every other minor and patch                                                                                                 | One PR a week instead of ten                                                                                                           |
| none                 | every other major                                                                                                           | One at a time: each can change behaviour                                                                                               |

**Ignored**: `@types/node` majors. They follow the Node version the site
runs on (24.x on Vercel and in CI): types for a newer major would accept APIs
that crash in production. Bump that major by hand with the runtime.

## What to do with a Dependabot PR

| PR                                        | Run                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload-next-react`                      | [`/upgrade-payload <n>`](../ai/skills.md#upgrade-payload-version--pr-number): release notes, types, import map, drift test, migration, every check      |
| Any other, to decide whether it can merge | [`/triage-deps <n>`](../ai/skills.md#triage-deps-pr-number): changelogs, code search, checks on current `staging`, a browser check for runtime packages |
| CI red                                    | [`/security-sweep`](../ai/skills.md#security-sweep---pr), locally: a small fix pushed to the PR, or a diagnosis                                         |
| CI ran on an old base                     | Comment `@dependabot rebase` on the PR                                                                                                                  |

Once someone else pushes to a Dependabot branch, Dependabot stops rebasing
that PR: that's expected. `/release` lists the Dependabot PRs nobody triaged
yet as "needs a verdict first".

## What Dependabot doesn't do

- **Transitive vulnerabilities** whose parent pins the vulnerable range:
  Dependabot can't bump them, so their alerts stay open. The
  [security sweep](../ai/github-agents.md#the-security-sweep) adds a scoped
  `pnpm.overrides` entry instead.
- **Code changes** an update needs: CI goes red, and the PR waits for
  `/security-sweep` or for you.
- **Closing alerts before production**: Dependabot alerts are computed on
  `main`, so they close once the fix ships in a release, not when its PR
  merges into `staging`.
