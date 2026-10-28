---
name: audit
description: Deep audit of the public site — SEO (canonical and hreflang per page, sitemap, robots, Open Graph images, JSON-LD, real 404s, admin noindex, domain redirects), accessibility and performance (Lighthouse, Core Web Vitals, mobile and desktop) — on production read-only, or on a local production build. Then offers the fixes, and ships the chosen ones as PRs. Example: /audit, /audit seo, /audit --local.
disable-model-invocation: true
argument-hint: '[--local] [seo|a11y|perf] [path…]'
---

# Audit of the public site

Arguments: `$ARGUMENTS`.

`/site-health` watches production every week, read-only, and compares with
the last check. This goes deeper, once: every SEO signal page by page, the
accessibility tree, the performance traces, and then it **fixes** what Zolan
picks.

- **Target**: production, `https://www.zolangivre.com`, **read-only** (no
  form sent, no admin login). With `--local`, the seeded production build of
  the current branch, the one e2e uses: `pnpm test:e2e:serve`, then
  `http://localhost:3100`. Useful before a release.
- **Axes**: `seo`, `a11y` or `perf` for one, all three by default.
- **Pages**: the paths given. Otherwise, in **both locales**:
  - `/fr` and `/en`;
  - the first project in the sitemap, `/fr/projects/<slug>` and
    `/en/projects/<slug>`;
  - `/fr/journal`, and its first entry `/fr/journal/<slug>`.

Tools: the **chrome-devtools** MCP server (`new_page`, `emulate`,
`lighthouse_audit`, `performance_start_trace` / `performance_stop_trace` /
`performance_analyze_insight`, `list_network_requests`, `take_snapshot`,
`evaluate_script`), and the `web-design-guidelines` skill to read UI code. If
chrome-devtools isn't connected, say so, then do SEO (everything goes through
`curl`) and what's possible without a browser.

## 1. SEO

All with `curl` and a little `node` to read the HTML:

- **`/robots.txt`**: allows the site, disallows `/admin` and `/api`, points
  to the sitemap on the `www` domain.
- **`/sitemap.xml`**: lists every public page in both locales, projects and
  journal entries included, each with its `alternates` (fr/en). **Every URL
  answers `200`**, with no redirect, and no admin or API URL is in it.
- **For each page audited**:
  - a `<title>` and a `meta description`, non-empty, and different from page
    to page;
  - `<html lang>` matching the locale;
  - a `link rel="canonical"`, absolute, on `https://www.zolangivre.com`,
    **equal to the page's own URL**. A project canonicalised to the home
    tells Google it's a duplicate of the home;
  - `link rel="alternate" hreflang` for `fr` and `en`, each pointing to
    **this page** in the other locale (not the home), and an `x-default`;
  - Open Graph and Twitter (`og:title`, `og:description`, `og:url`,
    `og:image` absolute and answering `200` as an image, `twitter:card` =
    `summary_large_image`). The images come from the `opengraph-image`
    routes: check each answers `200` with `content-type: image/png`.
- **JSON-LD**: each `<script type="application/ld+json">` parses. The layout
  emits a `Person` on every page (`src/app/(frontend)/[locale]/layout.tsx`):
  check its fields (`name`, `url`, `jobTitle`, `sameAs`, `image`) against
  the CMS. A project or journal entry with no JSON-LD of its own
  (`CreativeWork`, `Article`) is a finding to rank, not a failure.
- **Real 404s**: `/fr/projects/does-not-exist`, `/fr/journal/does-not-exist`
  and `/fr/does-not-exist` answer **`404`**, not a `200` with a "not found"
  page.
- **Admin**: `/admin` and its login carry a `noindex`, or are disallowed and
  never linked from the site.
- **Domain**: `https://zolangivre.com` (no `www`) redirects to
  `https://www.zolangivre.com` **permanently** (`301` or `308`). A `307` is
  Vercel's default when no code is picked: it's changed in the project's
  _Settings → Domains_. A preview of `staging` answers a redirect to Vercel's
  login, never an indexable page.

## 2. Accessibility

- Lighthouse, Accessibility category, on each page, mobile and desktop.
- On the accessibility tree (`take_snapshot`):
  - heading hierarchy (one `h1`);
  - accessible names of links and icon buttons (theme, language, menu, copy,
    shelf dots);
  - `alt` of content images, empty `alt` on decorative ones;
  - the contact form's labels and error messages;
  - tab order and visible focus;
  - the mobile menu out of the tree when closed.
- Contrast: the accent colour comes from the CMS (`settings.theme`), so check
  the accent text and the accent-on-soft pills in light **and** dark mode.
- `prefers-reduced-motion`: `emulate` with reduced motion; the page stays
  usable and nothing moves that shouldn't.
- For a component at fault, apply `web-design-guidelines` to its code.

## 3. Performance

For each page, **mobile** first (`emulate` with a phone profile and slow
4G), then desktop:

- Lighthouse (`lighthouse_audit`): Performance score, LCP, CLS, TBT, Speed
  Index.
- A performance trace on the home and a project: the LCP element and what
  delays it, layout shifts (CLS), long tasks, INP on an interaction (open
  the menu, switch the theme, swipe a shelf).
- Network (`list_network_requests`): images too heavy or without
  dimensions, render-blocking fonts, client JS a static section doesn't
  need, immutable assets without long cache, request chains.

Google's "good" thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.

## 4. Report

Per axis, a table `page | check | value | threshold | ✅/❌`, then the
problems. For each:

- **severity**: blocks indexing, measurable degradation, or detail;
- **probable cause**, with file and line when it's in the code;
- **proposed fix** and its cost.

Rank by **impact on visitors and search**, not by tool order. Don't invent a
problem to fill a column: a page that passes is good news.

## 5. Fixes

Ask Zolan which to apply (`AskUserQuestion`, multiple choice, most useful
first, with each one's cost). Then handle the chosen ones like `/feature`
(`.claude/skills/feature/SKILL.md`) from step 2, without a new plan to
approve: the choice is the approval. Write the plan file anyway, since
`/ship-plan`'s loop runs from it.

- One branch per theme: `fix/seo-…`, `fix/a11y-…`, `perf/…`.
- Commits `fix(seo): …`, `fix(a11y): …`, `perf(…): …`.
- After the fix, the same measure is taken again and given **before →
  after** in the PR. For production, "after" is measured on the PR's Vercel
  preview, or with `--local`.

## Report

Scores per page and axis, the problems found, those fixed (PR links, before
→ after), and those left aside with the reason.
