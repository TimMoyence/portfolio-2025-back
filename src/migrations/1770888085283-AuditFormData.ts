import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditFormData1770888085283 implements MigrationInterface {
    name = 'AuditFormData1770888085283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "websiteName" text NOT NULL, "contactMethod" character varying(20) NOT NULL, "contactValue" text NOT NULL, "done" boolean NOT NULL DEFAULT false, "ip" inet, "userAgent" text, "referer" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" character varying(50), CONSTRAINT "PK_c1e95e91267983f5b70dba5479c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit_requests"`);
    }

}
