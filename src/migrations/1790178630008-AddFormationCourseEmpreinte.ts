import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationCourseEmpreinte1790178630008 implements MigrationInterface {
  name = 'AddFormationCourseEmpreinte1790178630008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD "empreinte" character(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP COLUMN "empreinte"`,
    );
  }
}
