/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildActeurFormation,
  buildAdministrateur,
  buildFreeResponseRecord,
  buildSessionRecord,
  createMockFreeResponsesRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { SessionNotOwnedError } from '../../domain/errors/FormationErrors';
import { ListFreeResponsesUseCase } from '../ListFreeResponses.useCase';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = buildActeurFormation({ id: 'teacher-uuid' });

describe('ListFreeResponsesUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let sut: ListFreeResponsesUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ id: SESSION_ID, teacherId: PROPRIETAIRE.id }),
    );
    freeResponses = createMockFreeResponsesRepo();
    sut = new ListFreeResponsesUseCase(sessions, freeResponses);
  });

  it.each([
    ['au formateur proprietaire', PROPRIETAIRE],
    ['a un administrateur', buildAdministrateur()],
  ])('rend les reponses libres de la seance %s', async (_cas, acteur) => {
    await expect(sut.execute(SESSION_ID, acteur)).resolves.toEqual([
      buildFreeResponseRecord(),
    ]);
    expect(freeResponses.listBySession).toHaveBeenCalledWith(SESSION_ID);
  });

  it('refuse les reponses libres a un autre formateur', async () => {
    await expect(
      sut.execute(SESSION_ID, buildActeurFormation({ id: 'autre-uuid' })),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(freeResponses.listBySession).not.toHaveBeenCalled();
  });
});
