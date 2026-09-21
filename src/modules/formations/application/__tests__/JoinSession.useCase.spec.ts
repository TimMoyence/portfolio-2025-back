/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SeanceCompleteError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { JoinSessionUseCase } from '../JoinSession.useCase';

describe('JoinSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: JoinSessionUseCase;

  const commande = {
    code: '4271',
    studentKey: 'cle-derivee-du-courriel',
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
  };

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    cache = createMockSessionStateCache();
    sut = new JoinSessionUseCase(sessions, participants, cache);
  });

  it('confie l inscription au depot avec la capacite de la seance', async () => {
    sessions.findActiveByCode.mockResolvedValue(
      buildSessionRecord({ capacite: 12 }),
    );

    await sut.execute(commande);

    expect(participants.inscrire).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-uuid',
        studentKey: 'cle-derivee-du-courriel',
        capacite: 12,
      }),
    );
  });

  it('choisit une graine libre parmi celles que le depot lui presente', async () => {
    await sut.execute(commande);

    const { choisirGraine } = participants.inscrire.mock.calls[0][0];

    expect(choisirGraine([])).toBe(1001);
    expect(choisirGraine([1001])).toBe(1002);
    expect(choisirGraine([1001, 1002])).toBeNull();
  });

  it('laisse remonter la seance complete refusee par le depot', async () => {
    participants.inscrire.mockRejectedValue(new SeanceCompleteError(2));

    await expect(sut.execute(commande)).rejects.toThrow(SeanceCompleteError);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('signale une activite une fois le nouveau participant inscrit', async () => {
    await sut.execute(commande);

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
    expect(participants.inscrire.mock.invocationCallOrder[0]).toBeLessThan(
      cache.signalerActivite.mock.invocationCallOrder[0],
    );
  });

  it('rend sa place au participant deja inscrit, sans conflit ni activite', async () => {
    participants.inscrire.mockResolvedValue({
      participant: buildParticipantRecord({ seed: 1001 }),
      nouveau: false,
    });

    const result = await sut.execute(commande);

    expect(result).toMatchObject({
      participantId: 'participant-uuid',
      seed: 1001,
    });
    expect(participants.touch).toHaveBeenCalledWith('participant-uuid');
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('ne signale aucune activite quand l inscription echoue', async () => {
    participants.inscrire.mockRejectedValue(new Error('panne du depot'));

    await expect(sut.execute(commande)).rejects.toThrow('panne du depot');
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('refuse un code inconnu', async () => {
    sessions.findActiveByCode.mockResolvedValue(null);

    await expect(sut.execute(commande)).rejects.toThrow(SessionNotFoundError);
    expect(participants.inscrire).not.toHaveBeenCalled();
  });

  it('refuse de rejoindre une session terminee', async () => {
    sessions.findActiveByCode.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(SessionClosedError);
    expect(participants.inscrire).not.toHaveBeenCalled();
  });

  it('retourne l ecran courant et le mode de rythme', async () => {
    sessions.findActiveByCode.mockResolvedValue(
      buildSessionRecord({ ecranCourant: 5, modeRythme: 'libre' }),
    );

    const result = await sut.execute(commande);

    expect(result.ecranCourant).toBe(5);
    expect(result.modeRythme).toBe('libre');
  });
});
