/* eslint-disable @typescript-eslint/unbound-method */
import type { Repository } from 'typeorm';
import { MasteryRepositoryTypeORM } from './Mastery.repository.typeorm';
import type { FormationMasteryEntity } from './entities/FormationMastery.entity';

describe('MasteryRepositoryTypeORM', () => {
  let repo: jest.Mocked<Repository<FormationMasteryEntity>>;
  let sut: MasteryRepositoryTypeORM;

  const record = {
    studentKey: 'student-uuid',
    concept: 'capitalisation',
    boite: 2 as const,
    derniereVue: new Date('2026-09-11T08:00:00.000Z'),
    succes: 3,
    echecs: 1,
  };

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([record]),
      upsert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<FormationMasteryEntity>>;
    sut = new MasteryRepositoryTypeORM(repo);
  });

  it('upsert sur la cle composite studentKey plus concept', async () => {
    await sut.upsert(record);
    expect(repo.upsert).toHaveBeenCalledWith(
      {
        studentKey: 'student-uuid',
        concept: 'capitalisation',
        boite: 2,
        derniereVue: record.derniereVue,
        succes: 3,
        echecs: 1,
      },
      ['studentKey', 'concept'],
    );
  });

  it('ne met pas en conflit sur une autre colonne que la cle composite', async () => {
    await sut.upsert(record);
    const conflictColumns = repo.upsert.mock.calls[0]?.[1];
    expect(conflictColumns).toEqual(['studentKey', 'concept']);
    expect(conflictColumns).not.toContain('boite');
  });

  it('liste les etats de maitrise d un etudiant', async () => {
    const resultat = await sut.findByStudentKey('student-uuid');
    expect(resultat).toEqual([record]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { studentKey: 'student-uuid' },
    });
  });
});
