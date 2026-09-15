/* eslint-disable @typescript-eslint/unbound-method */
import type { Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { SeedAlreadyAssignedError } from '../domain/errors/FormationErrors';
import {
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import type { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { ParticipantsRepositoryTypeORM } from './Participants.repository.typeorm';

describe('ParticipantsRepositoryTypeORM', () => {
  let repo: jest.Mocked<Repository<FormationParticipantEntity>>;
  let sut: ParticipantsRepositoryTypeORM;

  const input = {
    sessionId: 'session-uuid',
    studentKey: 'student-uuid',
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
    seed: 1001,
  };

  beforeEach(() => {
    repo = {
      create: mockTypeOrmCreate(),
      save: mockTypeOrmSave({
        id: 'participant-uuid',
        rejointLe: new Date('2026-09-11T08:05:00.000Z'),
        dernierPing: new Date('2026-09-11T08:05:00.000Z'),
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(3),
    } as unknown as jest.Mocked<Repository<FormationParticipantEntity>>;
    sut = new ParticipantsRepositoryTypeORM(repo);
  });

  it('cree un participant', async () => {
    const participant = await sut.create(input);
    expect(participant.id).toBe('participant-uuid');
    expect(participant.seed).toBe(1001);
  });

  it('traduit la violation de UQ_formation_participants_session_key en conflit de session deja rejointe', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_formation_participants_session_key',
    });
    await expect(sut.create(input)).rejects.toThrow(ResourceConflictError);
    await expect(sut.create(input)).rejects.toThrow(
      'Ce participant a deja rejoint cette session',
    );
  });

  it('traduit la violation de UQ_formation_participants_session_seed en tirage deja attribue, distinct du conflit de session', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_formation_participants_session_seed',
    });
    await expect(sut.create(input)).rejects.toBeInstanceOf(
      SeedAlreadyAssignedError,
    );
    await expect(sut.create(input)).rejects.toThrow(
      'Le tirage 1001 est deja attribue dans cette session',
    );
  });

  it('ne masque pas une contrainte unique non reconnue derriere le message de session deja rejointe', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_autre_contrainte_inconnue',
    });
    await expect(sut.create(input)).rejects.toThrow(
      'Conflit lors de la creation du participant',
    );
  });

  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    repo.save.mockRejectedValue(new Error('connexion perdue'));
    await expect(sut.create(input)).rejects.toThrow('connexion perdue');
  });

  it('compte les participants d une seance sans les charger', async () => {
    await expect(sut.countBySession('session-uuid')).resolves.toBe(3);
    expect(repo.count).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid' },
    });
  });

  it('met a jour le dernier ping', async () => {
    await sut.touch('participant-uuid');
    expect(repo.update).toHaveBeenCalledWith(
      'participant-uuid',
      expect.objectContaining({ dernierPing: expect.any(Date) }),
    );
  });
});
