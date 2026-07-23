import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "url" varchar;
  ALTER TABLE "skills" DROP COLUMN IF EXISTS "level";
  DROP TYPE IF EXISTS "public"."enum_skills_level";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_skills_level" AS ENUM('advanced', 'intermediate', 'beginner');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "level" "enum_skills_level";
  ALTER TABLE "skills" DROP COLUMN IF EXISTS "url";`)
}
