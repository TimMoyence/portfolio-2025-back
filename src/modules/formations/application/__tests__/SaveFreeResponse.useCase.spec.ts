/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockFreeResponsesRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  BlankFieldError,
  SessionClosedError,
  SessionNotFoundError,
  SessionNotStartedError,
} from '../../domain/errors/FormationErrors';
import { SaveFreeResponseUseCase } from '../SaveFreeResponse.useCase';

const REPONSE = {
  sessionId: 'session-uuid',
  participantId: 'participant-uuid',
  screenId: 'B2-01-S11-REFLECTION',
  activityId: 'b2-s11-c1',
  response: '  Je vérifie la base.  ',
  dureeMs: 1400,
};

describe('SaveFreeResponseUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let sut: SaveFreeResponseUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'en_cours' }),
    );
    freeResponses = createMockFreeResponsesRepo();
    sut = new SaveFreeResponseUseCase(sessions, freeResponses);
  });

  it('enregistre la reponse du participant d une seance en cours, sans blancs superflus', async () => {
    await sut.execute(REPONSE);

    expect(freeResponses.save).toHaveBeenCalledWith({
      ...REPONSE,
      response: 'Je vérifie la base.',
    });
  });

  it.each([
    ['avant le demarrage de la seance', 'attente', SessionNotStartedError],
    ['apres la cloture de la seance', 'terminee', SessionClosedError],
  ] as const)('refuse la reponse %s', async (_cas, etat, erreur) => {
    sessions.findById.mockResolvedValue(buildSessionRecord({ etat }));

    await expect(sut.execute(REPONSE)).rejects.toThrow(erreur);
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  it('refuse une reponse vide avant toute lecture de la seance', async () => {
    await expect(sut.execute({ ...REPONSE, response: ' \n ' })).rejects.toThrow(
      BlankFieldError,
    );
    expect(sessions.findById).not.toHaveBeenCalled();
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(sut.execute(REPONSE)).rejects.toThrow(SessionNotFoundError);
  });
});
