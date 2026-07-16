import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ALTER COLUMN "order" DROP DEFAULT;
  ALTER TABLE "experiences" ALTER COLUMN "order" DROP DEFAULT;
  ALTER TABLE "education" ALTER COLUMN "order" DROP DEFAULT;
  ALTER TABLE "journal" ALTER COLUMN "order" DROP DEFAULT;
  ALTER TABLE "categories" ALTER COLUMN "order" DROP DEFAULT;
  UPDATE "projects" SET "order" = NULL WHERE "order" = 0;
  UPDATE "experiences" SET "order" = NULL WHERE "order" = 0;
  UPDATE "education" SET "order" = NULL WHERE "order" = 0;
  UPDATE "journal" SET "order" = NULL WHERE "order" = 0;
  UPDATE "categories" SET "order" = NULL WHERE "order" = 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "projects" SET "order" = 0 WHERE "order" IS NULL;
  UPDATE "experiences" SET "order" = 0 WHERE "order" IS NULL;
  UPDATE "education" SET "order" = 0 WHERE "order" IS NULL;
  UPDATE "journal" SET "order" = 0 WHERE "order" IS NULL;
  UPDATE "categories" SET "order" = 0 WHERE "order" IS NULL;
  ALTER TABLE "projects" ALTER COLUMN "order" SET DEFAULT 0;
  ALTER TABLE "experiences" ALTER COLUMN "order" SET DEFAULT 0;
  ALTER TABLE "education" ALTER COLUMN "order" SET DEFAULT 0;
  ALTER TABLE "journal" ALTER COLUMN "order" SET DEFAULT 0;
  ALTER TABLE "categories" ALTER COLUMN "order" SET DEFAULT 0;`)
}
