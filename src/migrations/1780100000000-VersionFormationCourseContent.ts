import { MigrationInterface, QueryRunner } from 'typeorm';

export class VersionFormationCourseContent1780100000000 implements MigrationInterface {
  name = 'VersionFormationCourseContent1780100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_screen_course_screen_id" ON "formation_screen_contents" ("course_id", "screen_id")`,
    );
    await queryRunner.query(
      `CREATE FUNCTION "reject_formation_course_content_change"() RETURNS trigger AS $$
       BEGIN
         RAISE EXCEPTION 'version publiée immuable';
       END;
       $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "trg_formation_course_immutable" BEFORE UPDATE OR DELETE ON "formation_course_contents" FOR EACH ROW EXECUTE FUNCTION "reject_formation_course_content_change"()`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "trg_formation_screen_immutable" BEFORE UPDATE OR DELETE ON "formation_screen_contents" FOR EACH ROW EXECUTE FUNCTION "reject_formation_course_content_change"()`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "trg_formation_screen_immutable" ON "formation_screen_contents"`,
    );
    await queryRunner.query(
      `DROP TRIGGER "trg_formation_course_immutable" ON "formation_course_contents"`,
    );
    await queryRunner.query(
      `DROP FUNCTION "reject_formation_course_content_change"()`,
    );
    await queryRunner.query(
      `DROP INDEX "uq_formation_screen_course_screen_id"`,
    );
  }
}
