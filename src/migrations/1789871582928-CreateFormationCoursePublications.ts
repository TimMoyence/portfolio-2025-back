import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationCoursePublications1789871582928 implements MigrationInterface {
  name = 'CreateFormationCoursePublications1789871582928';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_course_publications" ("slug" character varying(120) NOT NULL, "version_publiee" integer NOT NULL, "publiee_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "publiee_par" uuid, CONSTRAINT "chk_formation_course_publication_version" CHECK ("version_publiee" > 0), CONSTRAINT "PK_3bd02e874a6ab275b931f69934c" PRIMARY KEY ("slug"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "formation_course_publications"`);
  }
}
