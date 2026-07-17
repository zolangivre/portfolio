import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { lexicalToPlainText, textToLexicalParagraphs, type LexicalContent } from '@/lib/richText'

const columns = [
  { table: 'about_locales', column: 'description', notNull: false },
  { table: 'contact_locales', column: 'description', notNull: false },
  { table: 'education_locales', column: 'description', notNull: false },
  { table: 'experiences_locales', column: 'description', notNull: true },
  { table: 'sections_content_locales', column: 'projects_description', notNull: false },
  { table: 'sections_content_locales', column: 'experience_description', notNull: false },
  { table: 'sections_content_locales', column: 'education_description', notNull: false },
  { table: 'sections_content_locales', column: 'skills_description', notNull: false },
  { table: 'sections_content_locales', column: 'testimonials_description', notNull: false },
  { table: 'sections_content_locales', column: 'journal_description', notNull: false },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const { table, column, notNull } of columns) {
    const { rows } = await db.execute(sql.raw(`SELECT "id", "${column}" FROM "${table}";`))

    await db.execute(
      sql.raw(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL;
        ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE jsonb USING NULL;
      `),
    )

    for (const row of rows) {
      const value = typeof row[column] === 'string' ? row[column] : ''
      if (!notNull && value.trim().length === 0) continue

      await db.execute(sql`
        UPDATE ${sql.raw(`"${table}"`)}
        SET ${sql.raw(`"${column}"`)} = ${JSON.stringify(textToLexicalParagraphs(value))}::jsonb
        WHERE "id" = ${row.id};`)
    }

    if (notNull) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL;`))
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const { table, column, notNull } of columns) {
    const { rows } = await db.execute(sql.raw(`SELECT "id", "${column}" FROM "${table}";`))

    await db.execute(
      sql.raw(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL;
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE varchar USING NULL;
      `),
    )

    for (const row of rows) {
      const text = lexicalToPlainText(row[column] as LexicalContent | null)
      if (!notNull && !text) continue

      await db.execute(sql`
        UPDATE ${sql.raw(`"${table}"`)}
        SET ${sql.raw(`"${column}"`)} = ${text}
        WHERE "id" = ${row.id};`)
    }

    if (notNull) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL;`))
    }
  }
}
