---
name: i18n-copy
description: Rules for any text a visitor sees on the site (labels, headings, button text, aria-label, alt, title, placeholder, error and empty states, fallbacks, metadata) and for CMS fields that render on the site. Apply as soon as you add or change interface text in a component, a page or src/lib/i18n/dictionary.ts, or add a Payload field that shows on the site.
user-invocable: false
---

# Interface text: fr / en

The site has two locales, `fr` (the default) and `en` (`src/lib/locale.ts`).
Text comes from two places, and each has its rules.

## Text written in the code: the dictionary

1. **No visible text hard-coded** in a component or a page, including
   `aria-label`, `alt`, `title`, `placeholder`, `generateMetadata`, error and
   empty states, and **fallbacks** shown when a CMS field is empty (a
   fallback in English shows on the French site). It goes through
   `getDictionary(locale)` (`src/lib/i18n/dictionary.ts`).
2. **A key is added to the `Dictionary` interface and to both locales**, at
   the same path. Write both translations, never a copy of the French.
   `tests/unit/dictionary.spec.ts` fails if one locale misses a key, inside
   `Record<string, string>` maps too (the project statuses, the contact
   errors).
3. Reuse the section's namespace (`nav`, `projects`, `experience`,
   `education`, `skills`, `testimonials`, `about`, `contact`, `journal`,
   `lightbox`, `video`…), and document a key whose use isn't obvious with a
   one-line comment in the interface, like the existing ones.
4. **Client components** get the strings they need as props, not the whole
   dictionary: everything passed crosses the server/client boundary and
   ships in the page. A server component can take `dictionary`.
5. Remove a key from the interface and both locales once nothing uses it.

## Text typed in Payload: localized fields

6. A field whose value shows on the site is `localized: true`, so the editor
   fills it per locale. Payload falls back to `fr` when `en` is empty
   (`fallback: true` in `payload.config.ts`). Making a field localized, or
   adding one, changes the database (a `_locales` table): it needs a
   migration (`.claude/skills/new-migration/SKILL.md`).
7. Give it a `maxLength` that the layout can hold, above the longest current
   value (check the database), so an editor can't save text that breaks a
   card. The admin labels and descriptions stay in French
   (`src/lib/adminLabels.ts` explains why).
8. Section headings with a CMS value and a code default go through
   `resolveSectionCopy` (`src/lib/sectionCopy.ts`): CMS first, dictionary
   otherwise.

## Values

9. Dates and numbers through `Intl` with the page's locale. Month spans go
   through `formatMonthRange` (`src/lib/dates.ts`), read in UTC: Payload
   stores day-only dates at noon UTC.
10. Plural forms per locale (`Intl.PluralRules`), never `count + 's'`.
11. French typography in `fr` strings: the typographic apostrophe `’` (the
    dictionary uses it throughout), « guillemets », and a non-breaking space
    before `: ; ! ?` and inside « ».

## Check

```sh
pnpm test:unit tests/unit/dictionary.spec.ts
```

Then look at the changed screen in **both** locales: French often runs a
third longer than English, and a long word in a narrow card or a pill can
break the layout (see the `/feature` look step). Copy already
in the CMS is proofread with `/content-audit`.
