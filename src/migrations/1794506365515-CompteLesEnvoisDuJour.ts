import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompteLesEnvoisDuJour1794506365515 implements MigrationInterface {
  name = 'CompteLesEnvoisDuJour1794506365515';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "envois_du_jour" ("jour" date NOT NULL, "envoyes" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_370c060f1401bb525fde7c334d9" PRIMARY KEY ("jour"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "envois_du_jour"`);
  }
}
