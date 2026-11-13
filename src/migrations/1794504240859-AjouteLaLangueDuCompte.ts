import { MigrationInterface, QueryRunner } from 'typeorm';

export class AjouteLaLangueDuCompte1794504240859 implements MigrationInterface {
  name = 'AjouteLaLangueDuCompte1794504240859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "locale" character varying(2) NOT NULL DEFAULT 'fr'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locale"`);
  }
}
