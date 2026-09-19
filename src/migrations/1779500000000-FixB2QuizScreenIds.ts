import { MigrationInterface, QueryRunner } from 'typeorm';
import { QUIZZES } from './1779400000000-SeedB2QuizAndPresentationNotes';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

export class FixB2QuizScreenIds1779500000000 implements MigrationInterface {
  name = 'FixB2QuizScreenIds1779500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const quiz of QUIZZES) {
      if (!quiz.screenId.includes('-VOTE-')) {
        continue;
      }
      const interaction = {
        type: 'quiz',
        id: quiz.id,
        concept: quiz.concept,
        noteCompte: true,
        question: quiz.question,
        options: quiz.options,
        optionIds: quiz.options.map((_, index) => `o${index + 1}`),
        correctIndex: quiz.correctIndex,
        confusions: quiz.confusions,
        context: quiz.guide.aDire,
        explanation: quiz.guide.reponse,
        nextAction: quiz.guide.transition,
      };
      await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "proprietes" = "proprietes" || $1::jsonb
         WHERE "course_id" = $2 AND "screen_id" = $3`,
        [
          JSON.stringify({ interaction, guide: quiz.guide }),
          COURSE_ID,
          quiz.screenId,
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const quiz of QUIZZES) {
      if (!quiz.screenId.includes('-VOTE-')) {
        continue;
      }
      await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "proprietes" = "proprietes" - 'interaction' - 'guide'
         WHERE "course_id" = $1 AND "screen_id" = $2`,
        [COURSE_ID, quiz.screenId],
      );
    }
  }
}
