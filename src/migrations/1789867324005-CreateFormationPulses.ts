import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationPulses1789867324005 implements MigrationInterface {
  name = 'CreateFormationPulses1789867324005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_pulses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "cle_participant" character(64) NOT NULL, "sondage_id" character varying(60) NOT NULL, "etat" character varying(8) NOT NULL, "maj_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_formation_pulses_participant_sondage" UNIQUE ("session_id", "cle_participant", "sondage_id"), CONSTRAINT "CHK_formation_pulses_etat" CHECK ("etat" IN ('perdu', 'ca-va', 'clair')), CONSTRAINT "PK_2425711e0e8a3ab6175862406fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_pulses_session_sondage" ON "formation_pulses" ("session_id", "sondage_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_pulses" ADD CONSTRAINT "FK_formation_pulses_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_pulses" DROP CONSTRAINT "FK_formation_pulses_session"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_pulses_session_sondage"`,
    );
    await queryRunner.query(`DROP TABLE "formation_pulses"`);
  }
}
