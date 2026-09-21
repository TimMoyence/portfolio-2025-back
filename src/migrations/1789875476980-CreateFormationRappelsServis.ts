import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationRappelsServis1789875476980 implements MigrationInterface {
  name = 'CreateFormationRappelsServis1789875476980';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_rappels_servis" ("participant_id" uuid NOT NULL, "question_id" character varying(60) NOT NULL, "session_id" uuid NOT NULL, "rang" smallint NOT NULL, "servi_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_83b535ba61f7ab65ba157dfd7f7" PRIMARY KEY ("participant_id", "question_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_rappels_servis_session" ON "formation_rappels_servis" ("session_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_rappels_servis" ADD CONSTRAINT "FK_formation_rappels_servis_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_rappels_servis" ADD CONSTRAINT "FK_formation_rappels_servis_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_rappels_servis" DROP CONSTRAINT "FK_formation_rappels_servis_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_rappels_servis" DROP CONSTRAINT "FK_formation_rappels_servis_participant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_rappels_servis_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_rappels_servis"`);
  }
}
