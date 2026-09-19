import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_SLUG = 'b2-01-traitement-information-chiffree';

interface SessionRow {
  readonly id: string;
  readonly bareme: {
    readonly graineReference: number;
    readonly tirages: readonly { readonly seed: number }[];
  };
}

interface ParticipantRow {
  readonly id: string;
  readonly seed: number;
}

export class AlignB2ParticipantSeeds1779700000000 implements MigrationInterface {
  name = 'AlignB2ParticipantSeeds1779700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const sessions = (await queryRunner.query(
      `SELECT "id", "bareme"
       FROM "formation_sessions"
       WHERE "course_slug" = $1
         AND "etat" IN ('attente', 'en_cours')
         AND COALESCE(jsonb_array_length("bareme"->'questions'), 0) = 14
         AND "bareme"->'questions' @> '[{"id":"b2-s03-prediction"}]'::jsonb`,
      [COURSE_SLUG],
    )) as SessionRow[];

    for (const session of sessions) {
      const tirages = [...session.bareme.tirages.map((tirage) => tirage.seed)];
      const participants = (await queryRunner.query(
        `SELECT "id", "seed"
         FROM "formation_participants"
         WHERE "session_id" = $1
         ORDER BY "rejoint_le", "id"`,
        [session.id],
      )) as ParticipantRow[];
      const grainesOccupees = new Set<number>();
      for (const participant of participants) {
        if (
          tirages.includes(participant.seed) &&
          !grainesOccupees.has(participant.seed)
        ) {
          grainesOccupees.add(participant.seed);
          continue;
        }
        const graine = tirages.find(
          (candidate) => !grainesOccupees.has(candidate),
        );
        if (graine === undefined) {
          continue;
        }
        await queryRunner.query(
          `UPDATE "formation_participants" SET "seed" = $1 WHERE "id" = $2`,
          [graine, participant.id],
        );
        grainesOccupees.add(graine);
      }
    }
  }

  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Migration de données irréversible : AlignB2ParticipantSeeds ne conserve pas les graines de participants qu’elle remplace.',
      ),
    );
  }
}
