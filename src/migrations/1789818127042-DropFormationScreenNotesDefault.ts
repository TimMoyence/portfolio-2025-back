import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropFormationScreenNotesDefault1789818127042 implements MigrationInterface {
  name = 'DropFormationScreenNotesDefault1789818127042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ALTER COLUMN "notes" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ALTER COLUMN "notes" SET DEFAULT ''`,
    );
  }
}
