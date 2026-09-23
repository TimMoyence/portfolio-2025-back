import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationCourseContent1779100000000 implements MigrationInterface {
  name = 'CreateFormationCourseContent1779100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_course_contents" ("id" uuid NOT NULL, "slug" character varying(120) NOT NULL, "titre" character varying(180) NOT NULL, "niveau" character varying(20) NOT NULL, "duree_minutes" integer NOT NULL, "concepts" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_formation_course_contents_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_formation_course_contents_slug" ON "formation_course_contents" ("slug")`,
    );
    await queryRunner.query(
      `CREATE TABLE "formation_screen_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "position" integer NOT NULL, "screen_id" character varying(120) NOT NULL, "brique" character varying(40) NOT NULL, "duree_minutes" integer NOT NULL, "concepts" jsonb NOT NULL, "notes" text NOT NULL DEFAULT '', "proprietes" jsonb NOT NULL, CONSTRAINT "PK_formation_screen_contents_id" PRIMARY KEY ("id"), CONSTRAINT "FK_formation_screen_contents_course" FOREIGN KEY ("course_id") REFERENCES "formation_course_contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_screen_contents_course_position" ON "formation_screen_contents" ("course_id", "position")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "uq_formation_screen_contents_course_position"`,
    );
    await queryRunner.query(`DROP TABLE "formation_screen_contents"`);
    await queryRunner.query(`DROP INDEX "IDX_formation_course_contents_slug"`);
    await queryRunner.query(`DROP TABLE "formation_course_contents"`);
  }
}
