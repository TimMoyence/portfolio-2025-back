import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { SeedAlreadyAssignedError } from '../domain/errors/FormationErrors';
import {
  buildParticipantEntity,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import {
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import type { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { ParticipantsRepositoryTypeORM } from './Participants.repository.typeorm';

describe('ParticipantsRepositoryTypeORM', () => {
  const save = jest.fn();
  const update = jest.fn();
  const count = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const sut = new ParticipantsRepositoryTypeORM(
    mockTypeOrmRepository<FormationParticipantEntity>({
      create: mockTypeOrmCreate(),
      save,
      update,
      count,
      findOne,
      find,
    }),
  );

  const input = {
    sessionId: 'session-uuid',
    studentKey: 'student-uuid',
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
    seed: 1001,
  };

  beforeEach(() => {
    save.mockReset().mockImplementation(
      mockTypeOrmSave({
        id: 'participant-uuid',
        rejointLe: new Date('2026-09-11T08:05:00.000Z'),
        dernierPing: new Date('2026-09-11T08:05:00.000Z'),
      }),
    );
    update.mockReset().mockResolvedValue({ affected: 1 });
    count.mockReset().mockResolvedValue(3);
    findOne.mockReset().mockResolvedValue(buildParticipantEntity());
    find.mockReset().mockResolvedValue([buildParticipantEntity()]);
  });

  it('cree un participant', async () => {
    const participant = await sut.create(input);
    expect(participant.id).toBe('participant-uuid');
    expect(participant.seed).toBe(1001);
  });

  it('traduit la violation de UQ_formation_participants_session_key en conflit de session deja rejointe', async () => {
    save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_formation_participants_session_key',
    });
    await expect(sut.create(input)).rejects.toThrow(ResourceConflictError);
    await expect(sut.create(input)).rejects.toThrow(
      'Ce participant a deja rejoint cette session',
    );
  });

  it('traduit la violation de UQ_formation_participants_session_seed en tirage deja attribue, distinct du conflit de session', async () => {
    save.mockRejectedValue({
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
    save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_autre_contrainte_inconnue',
    });
    await expect(sut.create(input)).rejects.toThrow(
      'Conflit lors de la creation du participant',
    );
  });

  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    save.mockRejectedValue(new Error('connexion perdue'));
    await expect(sut.create(input)).rejects.toThrow('connexion perdue');
  });

  it('retrouve un participant par seance et cle etudiante, ou par identifiant', async () => {
    await expect(
      sut.findBySessionAndStudentKey('session-uuid', 'student-uuid'),
    ).resolves.toMatchObject({ id: 'participant-uuid' });
    await expect(sut.findById('participant-uuid')).resolves.toMatchObject({
      id: 'participant-uuid',
    });
    expect(findOne.mock.calls).toEqual([
      [{ where: { sessionId: 'session-uuid', studentKey: 'student-uuid' } }],
      [{ where: { id: 'participant-uuid' } }],
    ]);
  });

  it('rend null pour un participant absent', async () => {
    findOne.mockResolvedValue(null);
    await expect(sut.findById('inconnu')).resolves.toBeNull();
  });

  it('liste les participants et leurs graines dans l ordre d arrivee', async () => {
    await expect(sut.listBySession('session-uuid')).resolves.toHaveLength(1);
    await expect(sut.listSeedsBySession('session-uuid')).resolves.toEqual([
      1001,
    ]);
    expect(find.mock.calls).toEqual([
      [
        {
          where: { sessionId: 'session-uuid' },
          order: { rejointLe: 'ASC', id: 'ASC' },
        },
      ],
      [{ where: { sessionId: 'session-uuid' }, select: ['seed'] }],
    ]);
  });

  it('compte les participants d une seance sans les charger', async () => {
    await expect(sut.countBySession('session-uuid')).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid' },
    });
  });

  it('met a jour le dernier ping', async () => {
    await sut.touch('participant-uuid');
    expect(update).toHaveBeenCalledWith(
      'participant-uuid',
      expect.objectContaining({ dernierPing: expect.any(Date) }),
    );
  });
});
