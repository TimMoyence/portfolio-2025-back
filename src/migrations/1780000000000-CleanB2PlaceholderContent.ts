import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

export class CleanB2PlaceholderContent1780000000000 implements MigrationInterface {
  name = 'CleanB2PlaceholderContent1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "formation_screen_contents"
       SET "proprietes" = "proprietes" - 'titre' - 'paragraphes'
       WHERE "course_id" = $1
         AND "proprietes"->>'titre' = "screen_id"
         AND "proprietes"->'paragraphes'->>0 = 'Contenu visuel servi par le deck B2 partagé.'`,
      [COURSE_ID],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "formation_screen_contents"
       SET "proprietes" = "proprietes"
         || jsonb_build_object(
           'titre', "screen_id",
           'paragraphes', jsonb_build_array('Contenu visuel servi par le deck B2 partagé.')
         )
       WHERE "course_id" = $1`,
      [COURSE_ID],
    );
  }
}
