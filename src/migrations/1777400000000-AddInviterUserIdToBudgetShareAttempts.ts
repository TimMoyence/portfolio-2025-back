import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviterUserIdToBudgetShareAttempts1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_share_attempts" ADD COLUMN IF NOT EXISTS "inviter_user_id" uuid NULL;`,
    );
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_budget_share_attempts_inviter_quota"
        ON "budget_share_attempts" ("inviter_user_id", "sent_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_budget_share_attempts_inviter_quota";`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_share_attempts" DROP COLUMN IF EXISTS "inviter_user_id";`,
    );
  }
}
