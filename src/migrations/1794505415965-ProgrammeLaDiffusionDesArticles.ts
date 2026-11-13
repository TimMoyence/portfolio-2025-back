import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgrammeLaDiffusionDesArticles1794505415965 implements MigrationInterface {
  name = 'ProgrammeLaDiffusionDesArticles1794505415965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "article_broadcasts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleRecordId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'scheduled', "send_after" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_broadcast_article" UNIQUE ("articleRecordId"), CONSTRAINT "PK_c34dde00a7f7a8bc36f8ed224e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_article_broadcasts_due" ON "article_broadcasts" ("status", "send_after") `,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcasts" ADD CONSTRAINT "FK_article_broadcast_article" FOREIGN KEY ("articleRecordId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_broadcasts" DROP CONSTRAINT "FK_article_broadcast_article"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_article_broadcasts_due"`);
    await queryRunner.query(`DROP TABLE "article_broadcasts"`);
  }
}
