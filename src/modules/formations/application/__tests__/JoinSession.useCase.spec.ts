/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SeedAlreadyAssignedError,
  SeedPoolExhaustedError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { JoinSessionUseCase } from '../JoinSession.useCase';

const MAX_TENTATIVES_GRAINE = 60;

describe('JoinSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: JoinSessionUseCase;

  const commande = {
    code: '4271',
    studentKey: '11111111-1111-4111-8111-111111111111',
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

  it('signale une activite sur la session une fois le nouveau participant inscrit', async () => {
    await sut.execute(commande);
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
    expect(participants.create.mock.invocationCallOrder[0]).toBeLessThan(
      cache.signalerActivite.mock.invocationCallOrder[0],
    );
  });

  it('ne signale aucune activite au retour d un participant deja inscrit', async () => {
    participants.findBySessionAndStudentKey.mockResolvedValue(
      buildParticipantRecord(),
    );
    await sut.execute(commande);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('ne signale aucune activite quand l inscription echoue', async () => {
    participants.create.mockRejectedValue(new Error('panne du depot'));
    await expect(sut.execute(commande)).rejects.toThrow('panne du depot');
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('inscrit un nouveau participant avec un seed libre', async () => {
    const result = await sut.execute(commande);
    expect(result.seed).toBe(1001);
    expect(participants.create).toHaveBeenCalled();
  });

  it('attribue un seed different au deuxieme participant', async () => {
    participants.listSeedsBySession.mockResolvedValue([1001]);
    await sut.execute(commande);
    expect(participants.create).toHaveBeenCalledWith(
      expect.objectContaining({ seed: 1002 }),
    );
  });

  it('reconnait un participant deja inscrit sans le recreer', async () => {
    participants.findBySessionAndStudentKey.mockResolvedValue(
      buildParticipantRecord({ seed: 1001 }),
    );
    const result = await sut.execute(commande);
    expect(participants.create).not.toHaveBeenCalled();
    expect(result.seed).toBe(1001);
  });

  it('reprend sur la graine suivante quand celle qu il visait vient d etre prise', async () => {
    participants.listSeedsBySession
      .mockResolvedValueOnce([])
      .mockResolvedValue([1001]);
    participants.create
      .mockRejectedValueOnce(new SeedAlreadyAssignedError(1001))
      .mockResolvedValue(buildParticipantRecord({ seed: 1002 }));

    const result = await sut.execute(commande);

    expect(result.seed).toBe(1002);
    expect(participants.create).toHaveBeenCalledTimes(2);
  });

  it('laisse remonter une erreur d inscription qui n est pas un conflit de graine', async () => {
    participants.create.mockRejectedValue(new Error('panne du depot'));
    await expect(sut.execute(commande)).rejects.toThrow('panne du depot');
    expect(participants.create).toHaveBeenCalledTimes(1);
  });

  it('abandonne quand chaque tentative se heurte a une graine deja prise', async () => {
    participants.create.mockRejectedValue(new SeedAlreadyAssignedError(1001));
    await expect(sut.execute(commande)).rejects.toThrow(SeedPoolExhaustedError);
    expect(participants.create).toHaveBeenCalledTimes(MAX_TENTATIVES_GRAINE);
  });

  it('refuse un code inconnu', async () => {
    sessions.findActiveByCode.mockResolvedValue(null);
    await expect(sut.execute(commande)).rejects.toThrow(SessionNotFoundError);
  });

  it('refuse de rejoindre une session terminee', async () => {
    sessions.findActiveByCode.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    await expect(sut.execute(commande)).rejects.toThrow(SessionClosedError);
  });

  it('refuse quand tous les tirages sont attribues', async () => {
    participants.listSeedsBySession.mockResolvedValue([1001, 1002]);
    await expect(sut.execute(commande)).rejects.toThrow(SeedPoolExhaustedError);
    expect(participants.create).not.toHaveBeenCalled();
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
