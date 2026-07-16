import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const { rows: existing } = await db.execute(sql`
   SELECT to_regclass('public.about_points') AS table_name;
  `)
  const aboutPointsExists = Boolean(existing[0]?.table_name)

  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "about_point_groups" (
   	"_order" integer NOT NULL,
   	"_parent_id" integer NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"title" varchar NOT NULL
   );

  CREATE TABLE IF NOT EXISTS "about_point_groups_points" (
   	"_order" integer NOT NULL,
   	"_parent_id" varchar NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"value" varchar NOT NULL,
   	"_locale" "_locales" NOT NULL
   );

  DO $$ BEGIN
    ALTER TABLE "about_point_groups" ADD CONSTRAINT "about_point_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "about_point_groups_points" ADD CONSTRAINT "about_point_groups_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_point_groups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE INDEX IF NOT EXISTS "about_point_groups_order_idx" ON "about_point_groups" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "about_point_groups_parent_id_idx" ON "about_point_groups" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "about_point_groups_locale_idx" ON "about_point_groups" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_order_idx" ON "about_point_groups_points" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_parent_id_idx" ON "about_point_groups_points" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "about_point_groups_points_locale_idx" ON "about_point_groups_points" USING btree ("_locale");`)

  if (aboutPointsExists) {
    const { rows: parents } = await db.execute(sql`
     SELECT DISTINCT "_parent_id", "_locale" FROM "about_points";
    `)

    for (const parent of parents) {
      const { rows: groupRows } = await db.execute(sql`
       INSERT INTO "about_point_groups" ("id", "_order", "_parent_id", "_locale", "title")
      VALUES (replace(gen_random_uuid()::text, '-', ''), 1, ${parent._parent_id}, ${parent._locale}, 'Points')
      RETURNING "id";`)
      const groupId = groupRows[0].id

      const { rows: points } = await db.execute(sql`
       SELECT "value", "_order" FROM "about_points"
      WHERE "_parent_id" = ${parent._parent_id} AND "_locale" = ${parent._locale}
      ORDER BY "_order" ASC;`)

      for (const point of points) {
        await db.execute(sql`
         INSERT INTO "about_point_groups_points" ("id", "_order", "_parent_id", "value", "_locale")
        VALUES (replace(gen_random_uuid()::text, '-', ''), ${point._order}, ${groupId}, ${point.value}, ${parent._locale});`)
      }
    }

    await db.execute(sql`DROP TABLE "about_points" CASCADE;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "about_points" (
   	"_order" integer NOT NULL,
   	"_parent_id" integer NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"value" varchar NOT NULL
   );
  DO $$ BEGIN
    ALTER TABLE "about_points" ADD CONSTRAINT "about_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "about_points_order_idx" ON "about_points" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "about_points_parent_id_idx" ON "about_points" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "about_points_locale_idx" ON "about_points" USING btree ("_locale");

  DROP TABLE IF EXISTS "about_point_groups_points" CASCADE;
  DROP TABLE IF EXISTS "about_point_groups" CASCADE;`)
}
