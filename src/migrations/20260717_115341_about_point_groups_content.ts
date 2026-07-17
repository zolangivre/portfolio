import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const pointsToLexical = (values: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'list',
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: values.map((value) => ({
          type: 'listitem',
          value: 1,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'text',
              text: value,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
              version: 1,
            },
          ],
        })),
      },
    ],
  },
})

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const { rows: existing } = await db.execute(sql`
   SELECT to_regclass('public.about_point_groups_points') AS table_name;
  `)
  const pointsTableExists = Boolean(existing[0]?.table_name)

  await db.execute(sql`
   ALTER TABLE "about_point_groups" ADD COLUMN IF NOT EXISTS "content" jsonb;
  `)

  if (pointsTableExists) {
    const { rows: groups } = await db.execute(sql`
     SELECT "id" FROM "about_point_groups";
    `)

    for (const group of groups) {
      const { rows: points } = await db.execute(sql`
       SELECT "value" FROM "about_point_groups_points"
      WHERE "_parent_id" = ${group.id}
      ORDER BY "_order" ASC;`)

      const values = points.map((point) => point.value as string).filter(Boolean)
      if (values.length === 0) continue

      await db.execute(sql`
       UPDATE "about_point_groups"
      SET "content" = ${JSON.stringify(pointsToLexical(values))}::jsonb
      WHERE "id" = ${group.id};`)
    }

    await db.execute(sql`DROP TABLE "about_point_groups_points" CASCADE;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "about_point_groups_points" (
   	"_order" integer NOT NULL,
   	"_parent_id" varchar NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"value" varchar NOT NULL,
   	"_locale" "_locales" NOT NULL
   );
  DO $$ BEGIN
    ALTER TABLE "about_point_groups_points" ADD CONSTRAINT "about_point_groups_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_point_groups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_order_idx" ON "about_point_groups_points" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_parent_id_idx" ON "about_point_groups_points" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_locale_idx" ON "about_point_groups_points" USING btree ("_locale");`)

  const { rows: groups } = await db.execute(sql`
   SELECT "id", "_locale", "content" FROM "about_point_groups";
  `)

  for (const group of groups) {
    const content = group.content as {
      root?: { children?: Array<{ children?: Array<{ children?: Array<{ text?: string }> }> }> }
    } | null
    const listNode = content?.root?.children?.[0]
    const values = (listNode?.children ?? [])
      .map((item) => (item.children ?? []).map((child) => child.text ?? '').join(''))
      .filter((value) => value.trim().length > 0)

    let order = 1
    for (const value of values) {
      await db.execute(sql`
       INSERT INTO "about_point_groups_points" ("id", "_order", "_parent_id", "value", "_locale")
      VALUES (replace(gen_random_uuid()::text, '-', ''), ${order}, ${group.id}, ${value}, ${group._locale});`)
      order += 1
    }
  }

  await db.execute(sql`
   ALTER TABLE "about_point_groups" DROP COLUMN IF EXISTS "content";
  `)
}
