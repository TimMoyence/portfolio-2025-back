import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditLangchainIntegration1771323743536 implements MigrationInterface {
    name = 'AuditLangchainIntegration1771323743536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "processingStatus" character varying(20) NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "progress" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "step" text`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "error" text`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "normalizedUrl" text`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "finalUrl" text`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "redirectChain" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "keyChecks" jsonb NOT NULL DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "quickWins" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "pillarScores" jsonb NOT NULL DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "summaryText" text`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "fullReport" jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "startedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "audit_requests" ADD "finishedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "finishedAt"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "startedAt"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "fullReport"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "summaryText"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "pillarScores"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "quickWins"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "keyChecks"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "redirectChain"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "finalUrl"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "normalizedUrl"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "error"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "step"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "progress"`);
        await queryRunner.query(`ALTER TABLE "audit_requests" DROP COLUMN "processingStatus"`);
    }

}
