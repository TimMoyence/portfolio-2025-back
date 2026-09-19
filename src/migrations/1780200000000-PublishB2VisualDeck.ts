import { MigrationInterface, QueryRunner } from 'typeorm';
import { parseVisualPresentation } from '../modules/formations/domain/cours/VisualPresentation';
import { B2_VISUAL_SNAPSHOT } from './data/b2-visual.snapshot';

const SLUG = 'b2-01-traitement-information-chiffree';

interface CourseRow {
  id: string;
}

interface ScreenRow {
  position: number;
  screen_id: string;
  brique: string;
  duree_minutes: number;
  concepts: readonly string[];
  notes: string;
  proprietes: Record<string, unknown>;
}

export class PublishB2VisualDeck1780200000000 implements MigrationInterface {
  name = 'PublishB2VisualDeck1780200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const previous = (await queryRunner.query(
      `SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = 1`,
      [SLUG],
    )) as CourseRow[];
    if (previous.length !== 1)
      throw new Error('Version B2 initiale introuvable');
    const screens = (await queryRunner.query(
      `SELECT "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes"
       FROM "formation_screen_contents" WHERE "course_id" = $1 ORDER BY "position"`,
      [previous[0].id],
    )) as ScreenRow[];
    if (
      screens.length !== B2_VISUAL_SNAPSHOT.length ||
      screens.some(
        (screen, index) =>
          screen.position !== B2_VISUAL_SNAPSHOT[index].position ||
          screen.screen_id !== B2_VISUAL_SNAPSHOT[index].screenId,
      )
    ) {
      throw new Error('Le catalogue B2 et le deck source ne sont pas alignés');
    }

    const published = (await queryRunner.query(
      `INSERT INTO "formation_course_contents" ("slug", "version", "titre", "niveau", "duree_minutes", "concepts")
       SELECT "slug", 2, "titre", "niveau", "duree_minutes", "concepts"
       FROM "formation_course_contents" WHERE "id" = $1 RETURNING "id"`,
      [previous[0].id],
    )) as CourseRow[];
    const courseId = published[0].id;

    for (const [index, screen] of screens.entries()) {
      const visual = B2_VISUAL_SNAPSHOT[index];
      const presentation = parseVisualPresentation({
        renderer: visual.renderer,
        props: visual.props,
      });
      const proprietes = {
        ...screen.proprietes,
        presentation: {
          version: 2,
          screenId: screen.screen_id,
          ...presentation,
        },
        ...('corrections' in visual ? { correction: visual.corrections } : {}),
      };
      await queryRunner.query(
        `INSERT INTO "formation_screen_contents"
         ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)`,
        [
          courseId,
          screen.position,
          screen.screen_id,
          screen.brique,
          screen.duree_minutes,
          JSON.stringify(screen.concepts),
          screen.notes,
          JSON.stringify(proprietes),
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const sessions = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "formation_sessions"
       WHERE "course_slug" = $1 AND "course_version" = 2`,
      [SLUG],
    )) as { count: number }[];
    if (sessions[0].count > 0) {
      throw new Error(
        'Impossible de supprimer un contenu utilisé par une séance',
      );
    }
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DISABLE TRIGGER "trg_formation_course_immutable"`,
    );
    try {
      await queryRunner.query(
        `DELETE FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = 2`,
        [SLUG],
      );
    } finally {
      await queryRunner.query(
        `ALTER TABLE "formation_course_contents" ENABLE TRIGGER "trg_formation_course_immutable"`,
      );
      await queryRunner.query(
        `ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"`,
      );
    }
  }
}
