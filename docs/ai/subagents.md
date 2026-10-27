# Subagents

**English** · [Français](subagents.fr.md)

The four agents in [`.claude/agents/`](../../.claude/agents/). Commands launch
them for a second opinion; you rarely call one yourself, though you can ("ask
payload-reviewer to review this branch"). Back to the [overview](README.md).

Each starts with a fresh context: it doesn't see the conversation, only the
diff, the plan if there is one, and the repo. So it judges the change against
the plan, not the reasoning that produced it. All four run on Sonnet.

| Agent                                   | Looks at        | Can                                      | Launched by                                                                    |
| --------------------------------------- | --------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| [`test-writer`](#test-writer)           | A plan's Target | Write and run tests, under `tests/` only | `/ship-plan` (so `/feature`), before any code                                  |
| [`payload-reviewer`](#payload-reviewer) | The back end    | Read, `git`, `grep`, `migrate:status`    | `/ship-plan`, `/bug`, `/upgrade-payload`, `/security-sweep`, the GitHub review |
| [`ui-reviewer`](#ui-reviewer)           | The front end   | Read, `git`, `grep`, lint, `tsc`         | `/ship-plan`, `/bug`, `/security-sweep`, the GitHub review                     |
| [`webkit-reviewer`](#webkit-reviewer)   | Safari and iOS  | Read, `git`, `grep`, `gh` reads          | `/ship-plan`, when the diff touches what WebKit breaks                         |

The three reviewers share the same rules: only problems they can point to in
the code (or a CI log), no style nits, no generic advice. Each finding comes
with `file:line`, a concrete scenario where it breaks, and the fix. Nothing
survived? One line saying so. They modify no file.

## Which reviewer for which files

From [`/ship-plan`](skills.md#ship-plan-nnn---local-from-a-plan-to-a-pr) step
5, also used by the [GitHub review](github-agents.md#the-pr-review):

| Changed                                                                                                                                                                                               | Reviewer           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `src/collections`, `src/globals`, `src/fields`, `src/hooks`, `src/lib/access.ts`, `src/lib/actions`, `src/lib/queries`, `src/lib/cache.ts`, `src/migrations`, `src/payload.config.ts`, `src/proxy.ts` | `payload-reviewer` |
| `src/components`, `src/app/(frontend)`, any `.css`, `src/lib/motion`, `src/lib/i18n`                                                                                                                  | `ui-reviewer`      |
| Motion or view transitions, scrolling or shelves, the header or mobile menu, a modal or the lightbox, video, focus, CSS with `position`, `overflow`, `backdrop-filter`, viewport units or `:has()`    | `webkit-reviewer`  |
| Only docs, tests or CI                                                                                                                                                                                | none               |

The ones that apply run in parallel, in the same message. Their findings are
then triaged by the session that called them: fixed, rejected with a reason,
or deferred to the Backlog.

## `test-writer`

Writes the tests a plan calls for, **from the Target, not from the
implementation**: the code may not exist yet, and a test copied from it
proves nothing. It reads the plan, copies the style of the existing tests,
and reads source files only for their public surface.

It picks the lowest layer that can prove the Target:

| Layer | Where                     | For                                                                                     |
| ----- | ------------------------- | --------------------------------------------------------------------------------------- |
| unit  | `tests/unit/*.spec.ts`    | pure logic in `src/lib`, `src/hooks`, `src/proxy.ts`, the sitemap; I/O mocked           |
| int   | `tests/int/*.int.spec.ts` | real Payload: access rules (`overrideAccess: false`), schema, hooks against the DB      |
| dom   | `tests/dom/*.spec.tsx`    | one component's state, ARIA, keyboard, in jsdom                                         |
| e2e   | `tests/e2e/*.e2e.spec.ts` | visitor flows on the production build; seeded content in `fixtures.ts` and `prepare.ts` |

Rules: only under `tests/`, never `src/`; each test fails today for the
reason the plan gives (it runs them and reads the message); elements found
the way a visitor finds them (`getByRole`, `getByLabel`, French text); no
snapshots, no `waitForTimeout`, no class-name assertions; coverage stays
above 90% on `src/lib` and `src/hooks`; never the full e2e suite. What can't
be tested (animation feel) goes in its "à vérifier à l'œil" list, which ends
up in the PR.

## `payload-reviewer`

The back end, starting from `git diff origin/staging...HEAD`, with the
[`payload` skill](skills.md#payload) references at hand:

1. **Access control.** The REST and GraphQL APIs are public and answer from
   the access rules alone. Every collection and global has explicit access;
   collections with `visibility` use `readPublicOrAuthenticated`; `messages`
   is the only public `create`, and its server action validates and caps
   input. Local API calls with request-derived input need
   `overrideAccess: false`. Hooks that write pass `req` and don't loop.
2. **Schema and migration drift.** Every config change that alters the DB
   shape has a matching, registered migration, with a `down` that reverses it
   and data copied before a column goes.
3. **Cache and revalidation.** Every query in `src/lib/queries` lists, in its
   cache tags, every slug its result inlines (a new relation means a new
   tag). Rendered collections and globals have the revalidation hooks.
4. **Queries, server actions, hooks.** `visibility: public` in list **and**
   by-slug queries, `locale` in the query and the cache key, server actions
   validated and capped, external services (Resend) that can't fail a save,
   no `NEXT_PUBLIC_` secret, new env vars in `.env.example`.

## `ui-reviewer`

The front end, starting from `git diff staging...HEAD` and the uncommitted
changes, plus the plan if there is one (doing what the plan asks isn't a
finding; missing its Target is):

1. **Locales.** No hardcoded French or English in JSX, `aria-label`, `alt` or
   `title`; new dictionary keys in both locales; dates and numbers in the
   current locale.
2. **Motion.** Durations and easings from `src/lib/motion/tokens.ts` and the
   matching CSS custom properties, kept in sync; `transform` and `opacity`
   only; no `scale(0)` entrances; a `prefers-reduced-motion` rule for every
   CSS animation; hover effects inside `@media (hover: hover) and (pointer:
fine)`.
3. **Accessibility.** Real buttons and links, labels on icon-only controls,
   visible focus, alts from Media.
4. **Design direction.** Rounded and artistic, not technical: no monospace,
   `//` prefixes or grid motifs, no radius under ~16px on cards and buttons,
   Bagel Fat One only for the hero name and the logo, theme tokens rather
   than hardcoded colours.
5. **Server/client boundary.** `'use client'` only where needed; no client
   component imports `payload`.

## `webkit-reviewer`

WebKit doesn't install on this Mac, so the `mobile-safari` Playwright
project (iPhone 15, `mobile.e2e.spec.ts` and `navigation.e2e.spec.ts`) only
runs on CI. This agent works from the code and from CI:

1. **The diff**, for WebKit pitfalls: view transitions (Safari 18+, unique
   names), `overflow: hidden` + `border-radius` over a composited child
   (square corners without `isolation: isolate`), `-webkit-backdrop-filter`,
   `100vh` under the iOS toolbar, `fixed`/`sticky` under a transformed
   ancestor, safe-area insets, scroll-snap, feature support (the last two
   Safari versions), video autoplay (`muted playsinline`), inputs under 16px
   that zoom, sticky hover, Tab skipping links, `new Date('YYYY-MM-DD HH:mm')`.
2. **CI**: the branch's latest run, `mobile-safari` failures and flakes, the
   Playwright report and traces. Each is classed as an expected Safari
   difference (the test adapts), a real WebKit bug (file and line), or
   instability (see `/flaky`).
3. **Coverage**: a phone path the diff touches that no `mobile-safari` spec
   covers, with the test to add to `mobile.e2e.spec.ts`.

## Changing an agent

The frontmatter sets its `name`, the `description` Claude reads to decide
when to use it, its `tools` and its `model`. The body is its whole brief:
edit it like code, in a PR. The GitHub review reads the agents from
`staging`, so a change reaches it once merged.
