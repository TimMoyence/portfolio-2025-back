import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiffusionSeanceParDefaut1790500000000 implements MigrationInterface {
  name = 'DiffusionSeanceParDefaut1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ALTER COLUMN "diffusion" SET DEFAULT 'seance'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ALTER COLUMN "diffusion" SET DEFAULT 'catalogue'`,
    );
  }
}
