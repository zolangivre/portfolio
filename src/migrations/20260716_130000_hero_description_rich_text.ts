import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const textToLexical = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: text
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: paragraph,
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            version: 1,
          },
        ],
      })),
  },
})

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const { rows } = await db.execute(sql`SELECT "id", "description" FROM "hero_locales";`)

  await db.execute(sql`
   ALTER TABLE "hero_locales" ALTER COLUMN "description" DROP DEFAULT;
  ALTER TABLE "hero_locales" ALTER COLUMN "description" SET DATA TYPE jsonb USING NULL;`)

  for (const row of rows) {
    const description = row.description
    if (typeof description !== 'string' || description.trim().length === 0) continue

    await db.execute(sql`
     UPDATE "hero_locales"
    SET "description" = ${JSON.stringify(textToLexical(description))}::jsonb
    WHERE "id" = ${row.id};`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const { rows } = await db.execute(sql`SELECT "id", "description" FROM "hero_locales";`)

  await db.execute(sql`
   ALTER TABLE "hero_locales" ALTER COLUMN "description" SET DATA TYPE varchar USING NULL;`)

  for (const row of rows) {
    const description = row.description as
      | { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
      | null
    const paragraphs = (description?.root?.children ?? [])
      .map((node) => (node.children ?? []).map((child) => child.text ?? '').join(''))
      .filter((paragraph) => paragraph.trim().length > 0)
    if (paragraphs.length === 0) continue

    await db.execute(sql`
     UPDATE "hero_locales"
    SET "description" = ${paragraphs.join('\n\n')}
    WHERE "id" = ${row.id};`)
  }
}
