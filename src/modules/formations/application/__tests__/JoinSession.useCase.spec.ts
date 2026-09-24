/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  PlaceDejaPriseError,
  SeanceCompleteError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { SecretDeReprise } from '../../domain/SecretDeReprise';
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

  it('S1 · remet au poste un secret de reprise et ne confie au depot que son empreinte', async () => {
    const result = await sut.execute(commande);

    const { empreinteDeReprise } = participants.inscrire.mock.calls[0][0];

    expect(result.secretDeReprise).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(empreinteDeReprise).toBe(
      SecretDeReprise.empreinte(result.secretDeReprise),
    );
  });

  it('S1 · ne rend la place d un inscrit qu au poste qui presente son secret de reprise', async () => {
    const secret = SecretDeReprise.generer();
    const empreinte = SecretDeReprise.empreinte(secret);

    await sut.execute(commande);
    await sut.execute({ ...commande, secretDeReprise: secret });

    const sansSecret = participants.inscrire.mock.calls[0][0];
    const avecSecret = participants.inscrire.mock.calls[1][0];

    expect(sansSecret.repriseAutorisee(empreinte)).toBe(false);
    expect(avecSecret.repriseAutorisee(empreinte)).toBe(true);
    expect(sansSecret.repriseAutorisee(null)).toBe(true);
  });

  it('S1 · rend au poste la generation de jeton courante de sa place', async () => {
    participants.inscrire.mockResolvedValue({
      participant: buildParticipantRecord({ generationDeJeton: 2 }),
      nouveau: false,
    });

    const result = await sut.execute(commande);

    expect(result.generationDeJeton).toBe(2);
  });

  it('S1 · laisse remonter le refus du depot quand la place est deja prise', async () => {
    participants.inscrire.mockRejectedValue(new PlaceDejaPriseError());

    await expect(sut.execute(commande)).rejects.toThrow(PlaceDejaPriseError);
    expect(participants.touch).not.toHaveBeenCalled();
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
