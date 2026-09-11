/* eslint-disable @typescript-eslint/unbound-method */
import type { Repository } from 'typeorm';
import {
  buildBareme,
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import type { FormationSessionEntity } from './entities/FormationSession.entity';
import { SessionsRepositoryTypeORM } from './Sessions.repository.typeorm';

describe('SessionsRepositoryTypeORM', () => {
  let repo: jest.Mocked<Repository<FormationSessionEntity>>;
  let sut: SessionsRepositoryTypeORM;

  beforeEach(() => {
    repo = {
      create: mockTypeOrmCreate(),
      save: mockTypeOrmSave({ id: 'session-uuid' }),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<Repository<FormationSessionEntity>>;
    sut = new SessionsRepositoryTypeORM(repo);
  });

  it('cree une session en attente', async () => {
    const session = await sut.create({
      courseSlug: 'b1-09-interets-composes',
      teacherId: 'teacher-uuid',
      code: '4271',
      bareme: buildBareme(),
    });
    expect(session.etat).toBe('attente');
    expect(session.code).toBe('4271');
  });

  it('ne retourne pas une session terminee sur recherche par code', async () => {
    repo.findOne.mockResolvedValue(null);
    const session = await sut.findActiveByCode('4271');
    expect(session).toBeNull();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { code: '4271', etat: expect.anything() },
    });
  });

  it('signale un code deja pris', async () => {
    repo.count.mockResolvedValue(1);
    await expect(sut.isCodeTaken('4271')).resolves.toBe(true);
  });
});
