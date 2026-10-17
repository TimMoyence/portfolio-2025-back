import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetireLeProfilDuGuide1792400000000 implements MigrationInterface {
  name = 'RetireLeProfilDuGuide1792400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lead_magnet_requests" DROP COLUMN "profile"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lead_magnet_requests" ADD "profile" jsonb NOT NULL DEFAULT '{}'`,
    );
  }
}
