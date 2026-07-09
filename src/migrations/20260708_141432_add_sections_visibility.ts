import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sections_visibility" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero" boolean DEFAULT true,
  	"about" boolean DEFAULT true,
  	"projects" boolean DEFAULT true,
  	"experience" boolean DEFAULT true,
  	"education" boolean DEFAULT true,
  	"skills" boolean DEFAULT true,
  	"testimonials" boolean DEFAULT true,
  	"contact" boolean DEFAULT true,
  	"journal" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sections_visibility" CASCADE;`)
}
