import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticles1778800000000 implements MigrationInterface {
  name = 'CreateArticles1778800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" character varying(160) NOT NULL, "slug" character varying(120) NOT NULL, "locale" character varying(2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'published', "title" character varying(180) NOT NULL, "excerpt" character varying(280) NOT NULL, "contentMarkdown" text NOT NULL, "readingTimeMinutes" integer, "tags" jsonb NOT NULL, "sections" jsonb NOT NULL, "sources" jsonb NOT NULL, "provenance" jsonb NOT NULL, "seo" jsonb NOT NULL, "publishedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "contentSha256" character varying(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_articles_id" UNIQUE ("articleId"), CONSTRAINT "PK_articles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_articles_locale_slug" ON "articles" ("locale", "slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_articles_published_at" ON "articles" ("publishedAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "article_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deliveryId" character varying(128) NOT NULL, "idempotencyKey" character varying(160) NOT NULL, "nonce" character varying(128) NOT NULL, "articleRecordId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'accepted', "attempts" integer NOT NULL DEFAULT 1, "processedAt" TIMESTAMP WITH TIME ZONE, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_delivery_delivery" UNIQUE ("deliveryId"), CONSTRAINT "UQ_article_delivery_idempotency" UNIQUE ("idempotencyKey"), CONSTRAINT "UQ_article_delivery_nonce" UNIQUE ("nonce"), CONSTRAINT "PK_article_delivery_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_deliveries" ADD CONSTRAINT "FK_article_delivery_article" FOREIGN KEY ("articleRecordId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_deliveries" DROP CONSTRAINT "FK_article_delivery_article"`,
    );
    await queryRunner.query(`DROP TABLE "article_deliveries"`);
    await queryRunner.query(`DROP INDEX "idx_articles_published_at"`);
    await queryRunner.query(`DROP INDEX "uq_articles_locale_slug"`);
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
