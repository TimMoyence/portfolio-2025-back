import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfirmationDesDemandesDAudit1792658655788 implements MigrationInterface {
  name = 'ConfirmationDesDemandesDAudit1792658655788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ADD "confirmation_hash" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ADD "confirmee_le" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_audit_requests_confirmation_hash" ON "audit_requests" ("confirmation_hash") WHERE "confirmation_hash" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_requests_confirmation_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" DROP COLUMN "confirmee_le"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" DROP COLUMN "confirmation_hash"`,
    );
  }
}
