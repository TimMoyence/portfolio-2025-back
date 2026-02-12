import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCookieConsentGesture1770807863723
  implements MigrationInterface
{
  name = 'AddCookieConsentGesture1770807863723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cookie_consents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "policyVersion" character varying(50) NOT NULL, "locale" character varying(10) NOT NULL, "region" character varying(20) NOT NULL, "source" character varying(20) NOT NULL, "action" character varying(30) NOT NULL, "preferences" jsonb NOT NULL, "ip" inet, "userAgent" text, "referer" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_or_created_by" character varying(50), CONSTRAINT "PK_4785bbce481c55a6fec1ef80bbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "termsVersion" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "termsLocale" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "termsAcceptedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "termsMethod" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "termsMethod"`);
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP COLUMN "termsAcceptedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "termsLocale"`);
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP COLUMN "termsVersion"`,
    );
    await queryRunner.query(`DROP TABLE "cookie_consents"`);
  }
}
