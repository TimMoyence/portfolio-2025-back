import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationCapaciteEtEviction1789870829038 implements MigrationInterface {
  name = 'AddFormationCapaciteEtEviction1789870829038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP CONSTRAINT "UQ_formation_participants_session_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP CONSTRAINT "UQ_formation_participants_session_seed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD "capacite" smallint NOT NULL DEFAULT '40'`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD "evince_le" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_participants_session_seed" ON "formation_participants" ("session_id", "seed") WHERE "evince_le" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_participants_session_key" ON "formation_participants" ("session_id", "student_key") WHERE "evince_le" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD CONSTRAINT "chk_formation_session_capacite" CHECK ("capacite" BETWEEN 1 AND 60)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP CONSTRAINT "chk_formation_session_capacite"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_formation_participants_session_key"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_formation_participants_session_seed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP COLUMN "evince_le"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP COLUMN "capacite"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD CONSTRAINT "UQ_formation_participants_session_seed" UNIQUE ("session_id", "seed")`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD CONSTRAINT "UQ_formation_participants_session_key" UNIQUE ("session_id", "student_key")`,
    );
  }
}
