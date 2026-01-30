import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewTableInContact1768988552036 implements MigrationInterface {
  name = 'AddNewTableInContact1768988552036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "firstName" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "lastName" text NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contacts" ADD "phone" text`);
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "subject" text NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contacts" ADD "role" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "terms" boolean NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "terms"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "subject"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "firstName"`);
  }
}
