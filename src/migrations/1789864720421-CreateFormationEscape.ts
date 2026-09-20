import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationEscape1789864720421 implements MigrationInterface {
  name = 'CreateFormationEscape1789864720421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_escape_progress" ("participant_id" uuid NOT NULL, "enigme_id" character varying(60) NOT NULL, "session_id" uuid NOT NULL, "parcours_id" character varying(60) NOT NULL, "tentatives" integer NOT NULL DEFAULT '0', "resolue_le" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_formation_escape_progress_tentatives" CHECK ("tentatives" BETWEEN 0 AND 10), CONSTRAINT "PK_5960184b921d32b79b2b8997d6e" PRIMARY KEY ("participant_id", "enigme_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_escape_progress_session" ON "formation_escape_progress" ("session_id", "parcours_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "formation_escape_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "enigme_id" character varying(60) NOT NULL, "valeur_normalisee" numeric, "saisie" character varying(40) NOT NULL, "correcte" boolean NOT NULL, "soumis_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1305bbc1f62f555ef73528309fa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_escape_attempts_participant" ON "formation_escape_attempts" ("participant_id", "enigme_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_progress" ADD CONSTRAINT "FK_formation_escape_progress_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_progress" ADD CONSTRAINT "FK_formation_escape_progress_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_attempts" ADD CONSTRAINT "FK_formation_escape_attempts_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_attempts" ADD CONSTRAINT "FK_formation_escape_attempts_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_escape_attempts" DROP CONSTRAINT "FK_formation_escape_attempts_participant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_attempts" DROP CONSTRAINT "FK_formation_escape_attempts_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_progress" DROP CONSTRAINT "FK_formation_escape_progress_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_escape_progress" DROP CONSTRAINT "FK_formation_escape_progress_participant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_escape_attempts_participant"`,
    );
    await queryRunner.query(`DROP TABLE "formation_escape_attempts"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_escape_progress_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_escape_progress"`);
  }
}
