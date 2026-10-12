---
name: new-migration
description: Write a hand-written Payload/Postgres migration for a schema change (collection, global or field edit), register it, and prove it with a fresh migrate. Use whenever the Payload config changes shape.
disable-model-invocation: true
argument-hint: <slug, e.g. add_project_tagline>
---

# New migration

`payload migrate:create` is broken in this repo: its snapshots are stale, so it
generates diffs against the wrong schema. Migrations are written by hand,
modelled on the existing ones. Never run `migrate:create`.

Slug for this migration: `$ARGUMENTS` (ask for one if empty — snake_case,
describes the change, e.g. `add_project_tagline`).

## 1. Work out the exact SQL

- Read the config change (`git diff -- src/collections src/globals src/fields src/payload.config.ts`).
- Find how Payload names what you are adding. Look at the regenerated
  `src/payload-types.ts` and at earlier migrations that touched similar
  fields. Naming rules worth remembering:
  - columns are snake_case of the field path (`mockupImage` → `mockup_image_id` for an upload/relationship)
  - localized fields (`localized: true`) live in `<table>_locales`, keyed by `_locale` + `_parent_id`
  - polymorphic or `hasMany` relations live in `<table>_rels` (`path`, `order`, `<target>_id`)
  - arrays become `<table>_<field>` tables with `_order`, `_parent_id`, `id` (varchar)
  - `select` fields create an enum `enum_<table>_<field>`
  - new collections also need a `<slug>_id` column + FK + index on `payload_locked_documents_rels` (and `payload_preferences_rels` if relevant)
- If the read-only `postgres` MCP server is connected, inspect the live local schema with it instead of guessing.

## 2. Write the file

- Name: `src/migrations/YYYYMMDD_HHMMSS_<slug>.ts`, using the current UTC
  date/time (`date -u +%Y%m%d_%H%M%S`). It must sort after the latest file.
- Copy the structure of the most recent migration: `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`, then `up` and `down`, each calling `db.execute(sql\`…\`)`.
- Open with a doc comment explaining *why* the change exists, in the same tone as the existing ones.
- Make `up` idempotent where Postgres allows it (`IF NOT EXISTS`, `DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN null; END $$;` for constraints and enums).
- `down` must exactly undo `up`. If `up` moves data, `down` moves it back.
- Data that would be lost (dropped columns, type changes) has to be copied first. Say so in the comment.

## 3. Register it

Append an import and an entry to `src/migrations/index.ts`. Keep that file's
own style: semicolons, no trailing commas, `name` without extension. It is in
`.prettierignore` on purpose; don't reformat it.

## 4. Prove it

Run, in order, and stop at the first failure:

1. `pnpm payload migrate` applies it to the local dev database.
2. `pnpm payload migrate:down` then `pnpm payload migrate` to check that `down` really reverses `up`.
3. `pnpm test:int` drops the test DB, rebuilds it from the migrations alone,
   and `tests/int/schema.int.spec.ts` reads every collection and global in
   every locale. A missing table or column fails here.
4. `pnpm exec tsc --noEmit`

Report what each step printed. If something fails, fix the migration rather
than the test.
