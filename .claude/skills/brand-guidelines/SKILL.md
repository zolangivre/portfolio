---
name: brand-guidelines
description: Zolan Givre's brand: identity, voice, colours, type, shapes, surfaces, motion and backgrounds of the portfolio, with the tokens that implement each. Apply before designing or changing anything a visitor sees (a component, a section, a page, a stylesheet, an animation, an OG image, a background, a new theme option) and before producing anything that should look or sound like the site outside the code (a social banner, a slide, a CV visual, a mock-up, a Figma file).
---

# Brand guidelines

The site is Zolan Givre's personal portfolio: a full-stack engineer with a
designer's eye, and twenty years of competitive judo behind him. The brand
holds those two sides together. **Rigour underneath, warmth on the
surface**: the engineering shows in the care (speed, accessibility, motion
that respects settings), never as decoration.

Every value below lives in code. When this file and the code disagree, the
code is the truth: fix this file.

| Source                                     | Holds                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `src/app/globals.css`                      | Colour, radius, shadow, type and motion tokens; Tailwind `@theme`     |
| `src/app/(frontend)/[locale]/styles.css`   | Headings, eyebrow, logo, glass, cards, backgrounds, reduced variants  |
| `src/lib/theme/palette.ts`                 | The accent palette chosen in the CMS                                  |
| `src/lib/motion/tokens.ts`                 | Easings, durations and springs for `motion` (mirror of `globals.css`) |
| `src/components/ui/Button.tsx`, `Pill.tsx` | The one button and the one pill                                       |
| `src/lib/og.tsx`                           | Social preview images                                                 |
| `src/globals/GlobalSettings.ts`            | What the owner can change: colours, theme, background, cursor         |

## 1. Personality

| It is                                     | It is not                                        |
| ----------------------------------------- | ------------------------------------------------ |
| Rounded, soft, a little playful           | Square, technical, a spec sheet or a code editor |
| Artistic, hand-drawn, organic             | Generated-looking, geometric grids, blueprints   |
| Calm and precise                          | Loud, busy, gimmicky                             |
| Alive: things respond to touch            | Static, or moving for the sake of moving         |
| Personal: one person, in the first person | An agency, a template, "we"                      |

**Banned motifs**, even as a wink: monospace type (labels, tags, dates,
anything), `//` or `>_` prefixes, terminal or IDE chrome, graph-paper or
blueprint grids, rulers, numbered coordinates, small radii. The owner
rejected this direction explicitly.

## 2. Voice

- First person singular (« je »), addressing the visitor as « vous » in
  French and "you" in English.
- Calm, confident, concrete. The recurring words are « soigné »,
  « réfléchi », « rigueur », « calme »: say what was built and why it is
  good, not that it is "amazing" or "passionate".
- Short sentences. One idea per line in headings.
- Eyebrows are one or two words, nouns, set uppercase by CSS (never typed
  in capitals).
- Arrows carry direction: `→` to open, `←` to go back, `↗` for an external
  link. No emoji in the interface.
- Ground copy in the real background: Polytech Montpellier, Lizard Global
  (Kuala Lumpur, Rotterdam), the judo years, travel and photography. Never
  invent facts about him. The `zolan-profile` skill has the details.
- The mechanics of copy (dictionary, both locales, French typography) are
  in `.claude/skills/i18n-copy/SKILL.md`.

## 3. Colour

**The accent is the owner's choice, not the brand's.** He picks a primary
and an optional secondary colour in Payload → Global Settings → Theme. Never
hardcode a hue as "the" brand colour, and never design something that only
works in orange.

- Orange (`#a1490c` light, `#ff8a3d` dark) is the default and fallback, and
  the colour to use outside the site when one must be picked.
- Use only the tokens. Neutrals: `bg`, `bg-elevated`, `surface`,
  `surface-hover`, `border`, `border-strong`, `fg`, `fg-muted`,
  `fg-subtle`, `danger`. Accent: `accent`, `accent-strong` (hover),
  `accent-fg` (text on accent), `accent-soft` (tinted fill),
  `accent-soft-border`, `accent-2` (secondary, falls back to `accent`).
  In Tailwind: `bg-accent-soft`, `text-fg-muted`…; in CSS: `var(--accent)`.
- Derive new shades with `color-mix()` from these, as `globals.css` does.
  A new accent colour is one entry in `palette.ts`: a light value, a dark
  value, and which text tone reads on each.
- Every accent must hold **4.5:1** for text in both themes; the light
  values are deliberately deep, the dark ones bright.
- Neutrals are slightly green-grey warm in light (`#f4f5f2`), deep
  blue-black in dark (`#0a0d11`). Never pure white or pure black as a page
  background.
- The accent is a highlight, not a fill: eyebrows, the active filter, the
  primary button, the cursor, glows, the logo gradient. Large surfaces stay
  neutral.
- Both themes are first class. Default theme is a CMS setting (light,
  dark or system); check every change in both.

## 4. Typography

Three faces, all loaded with `next/font` in `[locale]/layout.tsx`.

| Face              | Variable               | Used for                                                           |
| ----------------- | ---------------------- | ------------------------------------------------------------------ |
| **Bagel Fat One** | `--font-bagel-fat-one` | The hero name (`#hero-title`) and the logo initials. Nothing else. |
| **Baloo 2**       | `--font-display`       | `h1`–`h4`, weight 700; card titles; the OG image titles            |
| **Inter**         | `--font-sans`          | Everything else: body, labels, buttons, forms                      |

- Bagel Fat One is the signature. It ships one weight (400): reset the
  weight, loosen tracking (`-0.01em` for the name). Using it elsewhere
  dilutes it.
- Scale: `h1` `clamp(2.7rem, 7vw, 4rem)`, hero name up to `5.4rem`, `h2`
  `clamp(1.8rem, 4vw, 2.8rem)`, `h3` `1.25rem`. Tracking tightens as size
  grows (`-0.045em` on `h1`, `-0.015em` on `h3`).
- Body `line-height: 1.65`; `text-lead` (1.05rem) for intros, in
  `fg-muted`, at most ~700px wide.
- The one uppercase style is the micro-label: `text-label uppercase`
  (11px, `0.18em` tracking, weight 500) for pills, badges and meta lines.
  The eyebrow is the section-level version (`.eyebrow`: caption size,
  700, `0.2em`, accent colour).
- `text-wrap: balance` on `h2`–`h4`, `pretty` on running text. Not on
  `h1`: it is typed in letter by letter.
- No monospace, anywhere, ever. No new font without the owner's say.

## 5. Shape

Large, soft radii. Nothing under 16px on anything a visitor sees as an
object.

| Token           | Value | For                                             |
| --------------- | ----- | ----------------------------------------------- |
| `rounded-card`  | 28px  | Grid cards, the hero photo, large images        |
| `rounded-group` | 24px  | Skill groups                                    |
| `rounded-panel` | 22px  | Timeline cards                                  |
| `rounded-inset` | 20px  | Thumbnails, gallery tiles, empty states         |
| `rounded-tile`  | 16px  | Skill tiles                                     |
| `rounded-full`  | pill  | Buttons, pills, chips, badges, avatars, toggles |

Organic shapes use asymmetric radii
(`58% 42% 65% 35% / 45% 55% 45% 55%`), like the ambient blobs: drawn, not
generated. Never perfect circles as decoration.

## 6. Surfaces and depth

- **Glass**: cards and panels are `.glass-surface` (`--glass-bg`, 78–80%
  opaque, a bright 1px top edge `--glass-edge`, `shadow-rest`). No
  backdrop blur on cards, it costs every scroll frame on a phone; blur is
  kept for the floating header and the lightbox. Glass turns solid under
  `prefers-reduced-transparency` and `prefers-contrast: more`.
- **Shadows**: `shadow-rest` and `shadow-raised` are long, low and soft,
  tinted by `--shadow-color` so they fade in dark. Hover feedback is the
  accent halo `shadow-glow` (`-sm` for small tiles), shown on its own
  `::after` layer via `.card-glow` and only its opacity animates.
- **Borders**: 1px `border`, turning `accent-soft-border` on hover or focus.

## 7. Components

Reuse before inventing. A new variant goes into the existing helper.

- **Button** (`buttonClassName`): pill, `px-5 py-3`, `text-sm
font-semibold`. `primary` is accent on `accent-fg`; `secondary` is
  `surface` with a `border-strong` edge. Hover changes colour only; the
  press dips to `0.97`. No zoom, ripple or magnetic pull.
- **Pill** (`pillClassName`): the only chip, tag, date or badge style.
  Tones `accent`, `neutral`, `floating` (over an image).
- **Cards**: `.card-glow` wrapper + `.card-lift` card. Only cards that are
  links lift (3px), tilt toward the pointer (`CardTilt`) and dip on press
  (`0.98`). A card you can't click doesn't move.
- **Section header** (`SectionHeader`): eyebrow, `h2`, optional rich-text
  intro. Every section opens this way.
- **Logo**: the owner's initials in Bagel Fat One, filled with a
  `linear-gradient(135deg, accent, accent-2)`, with a blinking accent
  cursor. The hero name types itself in on load with the same cursor.
  Both are the identity; keep them.
- **Icons**: inline SVG, `currentColor`, `aria-hidden`, 16px base,
  round line caps. No icon library.

## 8. Motion

Bouncy and alive at the moments that matter, quiet everywhere else.

- Tokens only. Durations `--duration-fast` 200ms (colour, opacity),
  `--duration-ui` 250ms (hover, focus, toggles), `--duration-base` 400ms
  (drawers, lightbox), `--duration-slow` 700ms (entrances). Easings
  `ease-out-premium` (default), `ease-bounce` (`0.34, 1.56, 0.64, 1`, for
  playful settles), `ease-in-out-premium`, `ease-spring-move` (view
  transitions). In `motion`: `springMove`, `springPlayful`, `springDrawer`,
  `springSnappy`, `springGentle` from `tokens.ts`. Keep the CSS and TS
  mirrors in sync.
- Animate `transform`, `scale` and `opacity`, not layout.
- Every press is felt: a 100ms dip (`0.94`–`0.98`) on the press, not the
  release.
- Signature moments: the typed hero name, the theme switch revealed as a
  circle from the toggle, shared-element morphs from a card to its page,
  the segmented-control pill gliding with a little bounce, the custom
  cursor (ring or trail, a CMS choice).
- Hover that moves sits inside `@media (hover: hover) and (pointer: fine)`.
- Reduced motion keeps fades and drops movement. Every CSS animation needs
  its `prefers-reduced-motion` rule; `motion` components are covered by
  `MotionProvider`.
- For the craft of a new animation, load the `animate` skill.

## 9. Backgrounds

The background is part of the identity and a CMS choice
(`backgroundStyle`): `gradient` (default, accent blobs), `photo`,
`spatial`, `playground`, `daylight`, `colorBlocks`. All follow the accent
colours. The rule they share: **the hero is where the background speaks,
the content is where it steps back** (blobs recede and dim as you scroll).
A new background style follows that rule, uses the accent tokens, has a
reduced-motion and a reduced-transparency state, and goes in
`src/components/ui/background/`.

## 10. Imagery

- Real photos of real things (projects, travel, judo), never stock or
  AI-generated people.
- Photos sit in `rounded-card` frames with a `border` and a soft shadow;
  the hero photo has an accent glow behind it.
- Project visuals live in device mock-ups (`DeviceMockup`) or covers.
- Alt text comes from the Media `alt` field; decorative images use `alt=""`.

## 11. Outside the site

For anything made outside the code (banner, slide, CV header, Figma
frame), use the same system: background `#f4f5f2` or `#0a0d11`, accent
`#a1490c` / `#ff8a3d` unless the owner names another palette colour, Bagel
Fat One for the name only, Baloo 2 for titles, Inter for text, radii from
the table above, a soft accent bloom in one corner (as `og.tsx` draws it).

## Check

Before calling a visual change done:

1. No hardcoded colour, radius, duration or easing that a token covers
   (`grep -nE '#[0-9a-fA-F]{3,6}|cubic-bezier|[0-9]+ms' <files>`).
2. Looked at it in light **and** dark, with at least two accent colours
   (one warm, one cool), at 390px and 1280px, in fr and en.
3. Reduced motion and touch: no movement left, no stuck hover.
4. Nothing from the banned list in section 1.

The `ui-reviewer` agent checks the same points on a diff.
