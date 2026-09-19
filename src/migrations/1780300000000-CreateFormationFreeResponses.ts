import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationFreeResponses1780300000000 implements MigrationInterface {
  name = 'CreateFormationFreeResponses1780300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "formation_free_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "participant_id" uuid NOT NULL,
        "screen_id" character varying(120) NOT NULL,
        "activity_id" character varying(120) NOT NULL,
        "response" text NOT NULL,
        "duree_ms" integer NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'enregistre',
        "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_formation_free_responses_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_formation_free_responses_participant_activity" UNIQUE ("session_id", "participant_id", "activity_id"),
        CONSTRAINT "FK_formation_free_responses_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_formation_free_responses_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_formation_free_responses_status" CHECK ("status" IN ('enregistre', 'en_attente', 'echec')),
        CONSTRAINT "CHK_formation_free_responses_duration" CHECK ("duree_ms" >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_formation_free_responses_session_screen" ON "formation_free_responses" ("session_id", "screen_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_formation_free_responses_session_screen"`,
    );
    await queryRunner.query(`DROP TABLE "formation_free_responses"`);
  }
}
