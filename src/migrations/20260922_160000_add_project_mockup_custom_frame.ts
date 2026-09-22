import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Adds the "custom" option (a mockup composed elsewhere and uploaded
 * ready-made) to the project mockup frame. The enum is recreated rather than
 * extended with ALTER TYPE ... ADD VALUE, which Postgres will not accept
 * inside the transaction Payload wraps migrations in on every version.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ALTER COLUMN "mockup_frame" DROP DEFAULT;
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_projects_mockup_frame";
  CREATE TYPE "public"."enum_projects_mockup_frame" AS ENUM('none', 'phone', 'desktop', 'custom');
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DATA TYPE "public"."enum_projects_mockup_frame" USING "mockup_frame"::"public"."enum_projects_mockup_frame";
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DEFAULT 'none';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ALTER COLUMN "mockup_frame" DROP DEFAULT;
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DATA TYPE text;
  UPDATE "projects" SET "mockup_frame" = 'none' WHERE "mockup_frame" = 'custom';
  DROP TYPE IF EXISTS "public"."enum_projects_mockup_frame";
  CREATE TYPE "public"."enum_projects_mockup_frame" AS ENUM('none', 'phone', 'desktop');
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DATA TYPE "public"."enum_projects_mockup_frame" USING "mockup_frame"::"public"."enum_projects_mockup_frame";
  ALTER TABLE "projects" ALTER COLUMN "mockup_frame" SET DEFAULT 'none';`)
}
