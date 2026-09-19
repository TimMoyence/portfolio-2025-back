import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationScores1780600000000 implements MigrationInterface {
  name = 'CreateFormationScores1780600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "formation_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "participant_id" uuid NULL,
        "kind" character varying(20) NOT NULL,
        "score" double precision NOT NULL,
        "percentage" double precision NOT NULL,
        "metrics" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_formation_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_formation_scores_session_participant_kind" UNIQUE ("session_id", "participant_id", "kind"),
        CONSTRAINT "FK_formation_scores_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_formation_scores_participant" FOREIGN KEY ("participant_id") REFERENCES "formation_participants"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_formation_scores_kind" CHECK ("kind" IN ('individual', 'session'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_formation_scores_session" ON "formation_scores" ("session_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_formation_scores_session_kind_session" ON "formation_scores" ("session_id", "kind") WHERE "participant_id" IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_scores_session"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_formation_scores_session_kind_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_scores"`);
  }
}
