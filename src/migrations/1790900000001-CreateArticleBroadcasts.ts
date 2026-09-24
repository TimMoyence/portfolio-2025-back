import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticleBroadcasts1790900000001 implements MigrationInterface {
  name = 'CreateArticleBroadcasts1790900000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "article_broadcasts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleRecordId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'scheduled', "sendAfter" TIMESTAMP WITH TIME ZONE NOT NULL, "lockedUntil" TIMESTAMP WITH TIME ZONE, "sentCount" integer NOT NULL DEFAULT 0, "failedCount" integer NOT NULL DEFAULT 0, "completedAt" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_broadcast_article" UNIQUE ("articleRecordId"), CONSTRAINT "PK_article_broadcasts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_article_broadcasts_due" ON "article_broadcasts" ("status", "sendAfter")`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcasts" ADD CONSTRAINT "FK_article_broadcast_article" FOREIGN KEY ("articleRecordId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "article_broadcast_recipients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "broadcastId" uuid NOT NULL, "subscriberId" uuid NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'sending', "error" character varying(200), "processedAt" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_broadcast_recipient" UNIQUE ("broadcastId", "subscriberId"), CONSTRAINT "PK_article_broadcast_recipients_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" ADD CONSTRAINT "FK_article_broadcast_recipient_broadcast" FOREIGN KEY ("broadcastId") REFERENCES "article_broadcasts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" ADD CONSTRAINT "FK_article_broadcast_recipient_subscriber" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "article_broadcasts" ("articleRecordId", "status", "sendAfter", "completedAt") SELECT "id", 'expired', "created_at", now() FROM "articles"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" DROP CONSTRAINT "FK_article_broadcast_recipient_subscriber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" DROP CONSTRAINT "FK_article_broadcast_recipient_broadcast"`,
    );
    await queryRunner.query(`DROP TABLE "article_broadcast_recipients"`);
    await queryRunner.query(
      `ALTER TABLE "article_broadcasts" DROP CONSTRAINT "FK_article_broadcast_article"`,
    );
    await queryRunner.query(`DROP INDEX "idx_article_broadcasts_due"`);
    await queryRunner.query(`DROP TABLE "article_broadcasts"`);
  }
}
