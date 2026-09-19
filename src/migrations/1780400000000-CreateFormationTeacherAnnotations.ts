import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationTeacherAnnotations1780400000000 implements MigrationInterface {
  name = 'CreateFormationTeacherAnnotations1780400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "formation_teacher_annotations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "teacher_id" uuid NOT NULL,
        "screen_id" character varying(120) NOT NULL,
        "group_name" character varying(120) NOT NULL DEFAULT 'Classe entière',
        "note" text NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_formation_teacher_annotations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_formation_teacher_annotations_session_screen_group" UNIQUE ("session_id", "screen_id", "group_name"),
        CONSTRAINT "FK_formation_teacher_annotations_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_formation_teacher_annotations_note" CHECK (length(btrim("note")) > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_formation_teacher_annotations_session_teacher" ON "formation_teacher_annotations" ("session_id", "teacher_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_formation_teacher_annotations_session_teacher"`,
    );
    await queryRunner.query(`DROP TABLE "formation_teacher_annotations"`);
  }
}
