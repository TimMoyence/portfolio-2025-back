import { MigrationInterface, QueryRunner } from 'typeorm';

export class AmorcerPublicationsDeCours1789871600000 implements MigrationInterface {
  name = 'AmorcerPublicationsDeCours1789871600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "formation_course_publications" ("slug", "version_publiee", "publiee_le")
       SELECT "slug", MAX("version"), now()
       FROM "formation_course_contents"
       GROUP BY "slug"
       ON CONFLICT ("slug") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "formation_course_publications"`);
  }
}
