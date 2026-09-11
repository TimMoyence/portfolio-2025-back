import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormations1778900000000 implements MigrationInterface {
  name = 'CreateFormations1778900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_slug" character varying(120) NOT NULL, "teacher_id" uuid NOT NULL, "code" character varying(4) NOT NULL, "etat" character varying(20) NOT NULL DEFAULT 'attente', "mode_rythme" character varying(10) NOT NULL DEFAULT 'pilote', "ecran_courant" integer NOT NULL DEFAULT 0, "intervalle_libre" jsonb, "bareme" jsonb NOT NULL, "ouverte_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fermee_le" TIMESTAMP WITH TIME ZONE, "maj_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_formation_sessions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_sessions_code_active" ON "formation_sessions" ("code") WHERE "etat" <> 'terminee'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_sessions_teacher" ON "formation_sessions" ("teacher_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "formation_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "student_key" uuid NOT NULL, "prenom" character varying(80) NOT NULL, "nom" character varying(80) NOT NULL, "email" character varying(180) NOT NULL, "seed" integer NOT NULL, "rejoint_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "dernier_ping" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_formation_participants_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_formation_participants_session_key" UNIQUE ("session_id", "student_key"), CONSTRAINT "UQ_formation_participants_session_seed" UNIQUE ("session_id", "seed"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD CONSTRAINT "FK_formation_participants_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_participants_student_key" ON "formation_participants" ("student_key")`,
    );

    await queryRunner.query(
      `CREATE TABLE "formation_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "question_id" character varying(60) NOT NULL, "concept" character varying(80) NOT NULL, "valeur" jsonb NOT NULL, "seed" integer NOT NULL, "correcte" boolean NOT NULL, "misconception" character varying(120), "duree_ms" integer NOT NULL, "soumis_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_formation_answers_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_formation_answers_participant_question" UNIQUE ("participant_id", "question_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_answers" ADD CONSTRAINT "FK_formation_answers_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_answers" ADD CONSTRAINT "FK_formation_answers_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_answers_session_question" ON "formation_answers" ("session_id", "question_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "formation_incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "type" character varying(40) NOT NULL, "contexte" jsonb, "horodatage" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_formation_incidents_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_incidents" ADD CONSTRAINT "FK_formation_incidents_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_incidents_session" ON "formation_incidents" ("session_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "formation_mastery" ("student_key" uuid NOT NULL, "concept" character varying(80) NOT NULL, "boite" integer NOT NULL DEFAULT 1, "derniere_vue" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "succes" integer NOT NULL DEFAULT 0, "echecs" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_formation_mastery" PRIMARY KEY ("student_key", "concept"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_formation_mastery_derniere_vue" ON "formation_mastery" ("derniere_vue")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_formation_mastery_derniere_vue"`);
    await queryRunner.query(`DROP TABLE "formation_mastery"`);
    await queryRunner.query(`DROP INDEX "idx_formation_incidents_session"`);
    await queryRunner.query(
      `ALTER TABLE "formation_incidents" DROP CONSTRAINT "FK_formation_incidents_participant"`,
    );
    await queryRunner.query(`DROP TABLE "formation_incidents"`);
    await queryRunner.query(
      `DROP INDEX "idx_formation_answers_session_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_answers" DROP CONSTRAINT "FK_formation_answers_participant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_answers" DROP CONSTRAINT "FK_formation_answers_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_answers"`);
    await queryRunner.query(
      `DROP INDEX "idx_formation_participants_student_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP CONSTRAINT "FK_formation_participants_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_participants"`);
    await queryRunner.query(`DROP INDEX "idx_formation_sessions_teacher"`);
    await queryRunner.query(`DROP INDEX "uq_formation_sessions_code_active"`);
    await queryRunner.query(`DROP TABLE "formation_sessions"`);
  }
}
