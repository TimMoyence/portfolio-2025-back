import {
  buildFreeResponseEntity,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import type { FormationFreeResponseEntity } from './entities/FormationFreeResponse.entity';
import { FreeResponsesRepositoryTypeORM } from './FreeResponses.repository.typeorm';

const REPONSE = {
  sessionId: 'session-uuid',
  participantId: 'participant-uuid',
  screenId: 'B2-01-01',
  activityId: 'reflection-1',
  response: 'Ma réponse',
  dureeMs: 1200,
};

describe('FreeResponsesRepositoryTypeORM', () => {
  const upsert = jest.fn();
  const find = jest.fn();
  const sut = new FreeResponsesRepositoryTypeORM(
    mockTypeOrmRepository<FormationFreeResponseEntity>({ upsert, find }),
  );

  beforeEach(() => {
    upsert.mockReset().mockResolvedValue(undefined);
    find.mockReset().mockResolvedValue([buildFreeResponseEntity()]);
  });

  it('ecrit une reponse libre en un seul upsert sur participant et activite', async () => {
    await sut.save(REPONSE);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({ ...REPONSE, status: 'enregistre' }, [
      'sessionId',
      'participantId',
      'activityId',
    ]);
  });

  it('relit les reponses de la seance dans l ordre de depot', async () => {
    await expect(sut.listBySession('session-uuid')).resolves.toEqual([
      expect.objectContaining({
        id: 'free-response-uuid',
        status: 'enregistre',
      }),
    ]);
    expect(find).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid' },
      order: { submittedAt: 'ASC' },
    });
  });
});
