import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyListQueryIndexes1771585098371 implements MigrationInterface {
  name = 'AddLegacyListQueryIndexes1771585098371';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "redirectChain" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "keyChecks" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "quickWins" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "pillarScores" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_status_order" ON "services" ("status", "order") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_status_order" ON "projects" ("status", "order") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_type_order" ON "projects" ("type", "order") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_redirects_enabled_created_at" ON "redirects" ("enabled", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_redirects_enabled_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_type_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_status_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_services_status_order"`);
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "pillarScores" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "quickWins" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "keyChecks" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "redirectChain" SET DEFAULT '[]'`,
    );
  }
}
