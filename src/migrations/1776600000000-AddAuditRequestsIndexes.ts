import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes sur audit_requests pour supporter les queries les plus frequentes :
 * - Dashboard / monitoring : filtrage par processingStatus + tri createdAt
 * - Rate limiting par IP : lookup (ip, created_at)
 * - Dedup par requestId : lookup unique requestId
 *
 * Audit DB 2026-04-17 : table sans aucun index secondaire (seulement PK),
 * scan sequentiel des 10k+ lignes des que la table grossit.
 */
export class AddAuditRequestsIndexes1776600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_requests_status_created_at"
        ON "audit_requests" ("processingStatus", "created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_requests_request_id"
        ON "audit_requests" ("requestId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_requests_ip_created_at"
        ON "audit_requests" ("ip", "created_at" DESC)
        WHERE "ip" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_requests_ip_created_at";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_requests_request_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_requests_status_created_at";`,
    );
  }
}
