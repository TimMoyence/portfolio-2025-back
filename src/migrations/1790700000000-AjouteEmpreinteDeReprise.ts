import { MigrationInterface, QueryRunner } from 'typeorm';

export class AjouteEmpreinteDeReprise1790700000000 implements MigrationInterface {
  name = 'AjouteEmpreinteDeReprise1790700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD "empreinte_de_reprise" character varying(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP COLUMN "empreinte_de_reprise"`,
    );
  }
}
