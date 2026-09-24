import { MigrationInterface, QueryRunner } from 'typeorm';

const CLASSE_ENTIERE = `'Classe entière'`;

export class RetireLesGroupesDeSuivi1790600000000 implements MigrationInterface {
  name = 'RetireLesGroupesDeSuivi1790600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMP TABLE "annotations_rabattues" ON COMMIT DROP AS
      SELECT
        "session_id",
        "screen_id",
        (array_agg("teacher_id" ORDER BY "group_name" <> ${CLASSE_ENTIERE}, "updated_at" DESC))[1] AS "teacher_id",
        string_agg(
          CASE WHEN "group_name" = ${CLASSE_ENTIERE} THEN "note" ELSE "group_name" || ' : ' || "note" END,
          E'\\n' ORDER BY "group_name" <> ${CLASSE_ENTIERE}, "group_name"
        ) AS "note",
        max("updated_at") AS "updated_at"
      FROM "formation_teacher_annotations"
      GROUP BY "session_id", "screen_id"
      HAVING bool_or("group_name" <> ${CLASSE_ENTIERE})
    `);
    await queryRunner.query(`
      DELETE FROM "formation_teacher_annotations" AS "annotation"
      USING "annotations_rabattues" AS "rabattue"
      WHERE "annotation"."session_id" = "rabattue"."session_id"
        AND "annotation"."screen_id" = "rabattue"."screen_id"
    `);
    await queryRunner.query(`
      INSERT INTO "formation_teacher_annotations" ("session_id", "teacher_id", "screen_id", "group_name", "note", "updated_at")
      SELECT "session_id", "teacher_id", "screen_id", ${CLASSE_ENTIERE}, "note", "updated_at"
      FROM "annotations_rabattues"
    `);
    await queryRunner.query(`DROP TABLE "annotations_rabattues"`);
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP CONSTRAINT "FK_formation_participants_group"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_participants_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP COLUMN "group_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_groups_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_groups"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "formation_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "name" character varying(80) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_formation_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_formation_groups_session_name" UNIQUE ("session_id", "name"),
        CONSTRAINT "FK_formation_groups_session" FOREIGN KEY ("session_id") REFERENCES "formation_sessions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_formation_groups_session" ON "formation_groups" ("session_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD "group_id" uuid NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "formation_participants"
      ADD CONSTRAINT "FK_formation_participants_group"
      FOREIGN KEY ("group_id") REFERENCES "formation_groups"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_formation_participants_group" ON "formation_participants" ("group_id")`,
    );
  }
}
