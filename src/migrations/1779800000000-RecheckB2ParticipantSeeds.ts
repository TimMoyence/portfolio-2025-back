import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_SLUG = 'b2-01-traitement-information-chiffree';

export class RecheckB2ParticipantSeeds1779800000000 implements MigrationInterface {
  name = 'RecheckB2ParticipantSeeds1779800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const sessions = (await queryRunner.query(
      `SELECT "id", "bareme"->'tirages' AS "tirages"
       FROM "formation_sessions"
       WHERE "course_slug" = $1
         AND "etat" IN ('attente', 'en_cours')
         AND COALESCE(jsonb_array_length("bareme"->'questions'), 0) = 14
         AND "bareme"->'questions' @> '[{"id":"b2-s03-prediction"}]'::jsonb`,
      [COURSE_SLUG],
    )) as readonly {
      readonly id: string;
      readonly tirages: readonly { readonly seed: number }[];
    }[];

    for (const session of sessions) {
      const seeds = session.tirages.map((tirage) => tirage.seed);
      const participants = (await queryRunner.query(
        `SELECT "id", "seed"
         FROM "formation_participants"
         WHERE "session_id" = $1
         ORDER BY "rejoint_le", "id"`,
        [session.id],
      )) as readonly { readonly id: string; readonly seed: number }[];
      const used = new Set(
        participants
          .map((participant) => participant.seed)
          .filter((seed) => seeds.includes(seed)),
      );
      for (const participant of participants) {
        const seed = seeds.find((candidate) => !used.has(candidate));
        if (seed === undefined) {
          continue;
        }
        if (seeds.includes(participant.seed)) {
          continue;
        }
        await queryRunner.query(
          `UPDATE "formation_participants" SET "seed" = $1 WHERE "id" = $2`,
          [seed, participant.id],
        );
        used.add(seed);
      }
    }
  }

  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Migration de données irréversible : RecheckB2ParticipantSeeds ne conserve pas les graines de participants qu’elle remplace.',
      ),
    );
  }
}
