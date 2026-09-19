import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormationGroups1780500000000 implements MigrationInterface {
  name = 'CreateFormationGroups1780500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
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

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_participants_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP CONSTRAINT "FK_formation_participants_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP COLUMN "group_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_formation_groups_session"`,
    );
    await queryRunner.query(`DROP TABLE "formation_groups"`);
  }
}
