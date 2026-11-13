import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreeLaNewsletter1794503420016 implements MigrationInterface {
  name = 'RecreeLaNewsletter1794503420016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "newsletter_subscribers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(254) NOT NULL, "boite" text NOT NULL, "locale" character varying(2) NOT NULL, "status" character varying(20) NOT NULL, "unsubscribe_token" uuid NOT NULL, "terms_version" character varying(50) NOT NULL, "terms_accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_mail_sent_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f87cc42de5e9925a48f806052c6" UNIQUE ("boite"), CONSTRAINT "UQ_82a83e8cdd1c7e0774e486f857a" UNIQUE ("unsubscribe_token"), CONSTRAINT "PK_38f9333e9961b2fdb589128d19b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter_confirmations" ("token_hash" character(64) NOT NULL, "boite" text NOT NULL, "locale" character varying(2) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b3eab60449d8f81f91de6cd39df" PRIMARY KEY ("token_hash"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_newsletter_confirmations_boite" ON "newsletter_confirmations" ("boite") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_newsletter_confirmations_boite"`,
    );
    await queryRunner.query(`DROP TABLE "newsletter_confirmations"`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers"`);
  }
}
