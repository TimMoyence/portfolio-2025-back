import { MigrationInterface, QueryRunner } from 'typeorm';

export class TientLesDestinatairesDesDiffusions1794505635489 implements MigrationInterface {
  name = 'TientLesDestinatairesDesDiffusions1794505635489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "article_broadcast_recipients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "broadcast_id" uuid NOT NULL, "subscriber_id" uuid NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'sending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_article_broadcast_recipient" UNIQUE ("broadcast_id", "subscriber_id"), CONSTRAINT "PK_63f75f775925096de76380badb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" ADD CONSTRAINT "FK_article_broadcast_recipient_broadcast" FOREIGN KEY ("broadcast_id") REFERENCES "article_broadcasts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" ADD CONSTRAINT "FK_article_broadcast_recipient_subscriber" FOREIGN KEY ("subscriber_id") REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" DROP CONSTRAINT "FK_article_broadcast_recipient_subscriber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_broadcast_recipients" DROP CONSTRAINT "FK_article_broadcast_recipient_broadcast"`,
    );
    await queryRunner.query(`DROP TABLE "article_broadcast_recipients"`);
  }
}
