/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SeedPoolExhaustedError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { JoinSessionUseCase } from '../JoinSession.useCase';

describe('JoinSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
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
    sut = new JoinSessionUseCase(sessions, participants);
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
