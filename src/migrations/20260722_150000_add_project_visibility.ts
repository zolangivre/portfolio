import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_projects_visibility" AS ENUM('public', 'private');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "visibility" "enum_projects_visibility" DEFAULT 'public' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP COLUMN IF EXISTS "visibility";
  DROP TYPE IF EXISTS "public"."enum_projects_visibility";`)
}
