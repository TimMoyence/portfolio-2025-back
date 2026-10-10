import { MigrationInterface, QueryRunner } from 'typeorm';

export class HacheLesJetonsDeVerification1791624795249 implements MigrationInterface {
  name = 'HacheLesJetonsDeVerification1791624795249';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" RENAME COLUMN "token" TO "token_hash"`,
    );
    await queryRunner.query(
      `UPDATE "email_verification_tokens" SET "token_hash" = encode(sha256(convert_to("token_hash", 'UTF8')), 'hex')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "email_verification_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" RENAME COLUMN "token_hash" TO "token"`,
    );
  }
}
