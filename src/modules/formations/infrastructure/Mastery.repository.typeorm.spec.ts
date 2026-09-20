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

  function requeteEmise(): string {
    return repo.query.mock.calls[0][0].replace(/\s+/g, ' ');
  }

  function parametresDe(appel: number): unknown[] {
    return repo.query.mock.calls[appel][1] as unknown[];
  }

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([record]),
      query: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Repository<FormationMasteryEntity>>;
    sut = new MasteryRepositoryTypeORM(repo);
  });

  it('incremente les compteurs en base au lieu de reecrire un total lu avant', async () => {
    await sut.enregistrerTentative({
      studentKey: 'student-uuid',
      concept: 'capitalisation',
      reussi: true,
      vueLe: record.derniereVue,
    });

    expect(requeteEmise()).toContain(
      'succes = formation_mastery.succes + EXCLUDED.succes',
    );
    expect(requeteEmise()).toContain(
      'echecs = formation_mastery.echecs + EXCLUDED.echecs',
    );
  });

  it('resout le conflit sur la cle composite studentKey plus concept', async () => {
    await sut.enregistrerTentative({
      studentKey: 'student-uuid',
      concept: 'capitalisation',
      reussi: false,
      vueLe: record.derniereVue,
    });

    expect(requeteEmise()).toContain('ON CONFLICT (student_key, concept)');
  });

  it('compte un succes ou un echec selon le verdict', async () => {
    await sut.enregistrerTentative({
      studentKey: 'student-uuid',
      concept: 'capitalisation',
      reussi: true,
      vueLe: record.derniereVue,
    });
    await sut.enregistrerTentative({
      studentKey: 'student-uuid',
      concept: 'capitalisation',
      reussi: false,
      vueLe: record.derniereVue,
    });

    const [, , , , succesReussi, echecsReussi] = parametresDe(0);
    const [, , , , succesEchoue, echecsEchoue] = parametresDe(1);
    expect([succesReussi, echecsReussi]).toEqual([1, 0]);
    expect([succesEchoue, echecsEchoue]).toEqual([0, 1]);
  });

  it('liste les etats de maitrise d un etudiant', async () => {
    const resultat = await sut.findByStudentKey('student-uuid');
    expect(resultat).toEqual([record]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { studentKey: 'student-uuid' },
    });
  });
});
