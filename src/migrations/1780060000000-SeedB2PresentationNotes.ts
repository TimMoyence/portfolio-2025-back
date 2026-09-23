import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedB2PresentationNotes1780060000000 implements MigrationInterface {
  name = 'SeedB2PresentationNotes1780060000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD CONSTRAINT "chk_formation_screen_notes_not_blank" CHECK (length(btrim("notes")) > 0)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP CONSTRAINT "chk_formation_screen_notes_not_blank"`,
    );
  }
}
