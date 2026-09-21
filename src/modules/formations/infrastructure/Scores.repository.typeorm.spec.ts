import { mockTypeOrmRepository } from '../../../../test/factories/formation-entities.factory';
import type { FormationScoreEntity } from './entities/FormationScore.entity';
import { ScoresRepositoryTypeORM } from './Scores.repository.typeorm';

const SESSION_ID = 'session-uuid';

describe('ScoresRepositoryTypeORM', () => {
  const upsert = jest.fn();
  const sut = new ScoresRepositoryTypeORM(
    mockTypeOrmRepository<FormationScoreEntity>({ upsert }),
  );

  beforeEach(() => {
    upsert.mockReset().mockResolvedValue(undefined);
  });

  it('persiste en une seule requete atomique les scores individuels, completion comprise', async () => {
    await sut.saveIndividuals([
      {
        sessionId: SESSION_ID,
        participantId: 'participant-uuid',
        note: 9,
        completion: 0.45,
      },
    ]);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          sessionId: SESSION_ID,
          participantId: 'participant-uuid',
          kind: 'individual',
          score: 9,
          percentage: 0.45,
          metrics: {},
        },
      ],
      ['sessionId', 'participantId', 'kind'],
    );
  });

  it('n ecrit rien pour une seance sans participant', async () => {
    await sut.saveIndividuals([]);

    expect(upsert).not.toHaveBeenCalled();
  });

  it('persiste le score de seance sur l index unique partiel des lignes sans participant', async () => {
    await sut.saveSession({
      sessionId: SESSION_ID,
      moyenne: 8,
      mediane: 8,
      dispersion: 1.5,
      tauxParticipation: 0.9,
      tauxReussite: 0.8,
      questionsProblemes: ['Q1'],
    });

    expect(upsert).toHaveBeenCalledWith(
      {
        sessionId: SESSION_ID,
        participantId: null,
        kind: 'session',
        score: 8,
        percentage: 0.8,
        metrics: {
          mediane: 8,
          dispersion: 1.5,
          tauxParticipation: 0.9,
          questionsProblemes: ['Q1'],
        },
      },
      {
        conflictPaths: ['sessionId', 'kind'],
        indexPredicate: '"participant_id" IS NULL',
      },
    );
  });
});
