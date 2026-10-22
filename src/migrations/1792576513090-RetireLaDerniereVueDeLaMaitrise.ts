import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetireLaDerniereVueDeLaMaitrise1792576513090 implements MigrationInterface {
  name = 'RetireLaDerniereVueDeLaMaitrise1792576513090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_mastery_derniere_vue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_mastery" DROP COLUMN "derniere_vue"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_mastery" ADD "derniere_vue" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_mastery_derniere_vue" ON "formation_mastery" ("derniere_vue")`,
    );
  }
}
