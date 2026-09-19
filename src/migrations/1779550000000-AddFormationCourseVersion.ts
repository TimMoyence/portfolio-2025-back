import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationCourseVersion1779550000000 implements MigrationInterface {
  name = 'AddFormationCourseVersion1779550000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD CONSTRAINT "chk_formation_course_version_positive" CHECK ("version" > 0)`,
    );
    await queryRunner.query(`DROP INDEX "IDX_formation_course_contents_slug"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_course_slug_version" ON "formation_course_contents" ("slug", "version")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP INDEX "uq_formation_course_slug_version"`);
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP CONSTRAINT "chk_formation_course_version_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP COLUMN "version"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_formation_course_contents_slug" ON "formation_course_contents" ("slug")`,
    );
  }
}
