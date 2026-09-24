import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotesFormateurFacultatives1790300000000 implements MigrationInterface {
  name = 'NotesFormateurFacultatives1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP CONSTRAINT "chk_formation_screen_notes_not_blank"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD CONSTRAINT "chk_formation_screen_notes_absentes_ou_renseignees" CHECK ("notes" = '' OR "notes" ~ '[^[:space:]]')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP CONSTRAINT "chk_formation_screen_notes_absentes_ou_renseignees"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD CONSTRAINT "chk_formation_screen_notes_not_blank" CHECK (length(btrim("notes")) > 0) NOT VALID`,
    );
  }
}
