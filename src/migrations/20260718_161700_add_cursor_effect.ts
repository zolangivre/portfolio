import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_settings_theme_cursor_effect" AS ENUM('ring', 'trail');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_cursor_effect" "enum_settings_theme_cursor_effect" DEFAULT 'ring';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN IF EXISTS "theme_cursor_effect";
  DROP TYPE IF EXISTS "public"."enum_settings_theme_cursor_effect";`)
}
