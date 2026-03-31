import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUsers1775100000000 implements MigrationInterface {
  name = 'AddGoogleIdToUsers1775100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "google_id" varchar UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les utilisateurs Google-only (sans mot de passe) avant de remettre la contrainte NOT NULL
    await queryRunner.query(
      `DELETE FROM "users" WHERE "password_hash" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
    );
  }
}
