import { MigrationInterface, QueryRunner } from 'typeorm';

export class VideLesSeancesEtLesVersionsDeCours1793097907840 implements MigrationInterface {
  name = 'VideLesSeancesEtLesVersionsDeCours1793097907840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      TRUNCATE TABLE
        "formation_rappels_servis",
        "formation_pulses",
        "formation_escape_attempts",
        "formation_escape_progress",
        "formation_teacher_annotations",
        "formation_free_responses",
        "formation_incidents",
        "formation_answers",
        "formation_participants",
        "formation_sessions",
        "formation_mastery",
        "formation_course_publications",
        "formation_screen_contents",
        "formation_course_contents"
    `);
  }

  public async down(): Promise<void> {}
}
