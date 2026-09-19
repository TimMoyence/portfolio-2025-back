import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationSessionCourseVersion1780050000000 implements MigrationInterface {
  name = 'AddFormationSessionCourseVersion1780050000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD "course_version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD CONSTRAINT "chk_formation_session_course_version_positive" CHECK ("course_version" > 0)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP CONSTRAINT "chk_formation_session_course_version_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP COLUMN "course_version"`,
    );
  }
}
