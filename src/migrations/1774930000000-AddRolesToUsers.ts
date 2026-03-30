import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesToUsers1774930000000 implements MigrationInterface {
  name = 'AddRolesToUsers1774930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "roles" text NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roles"`);
  }
}
