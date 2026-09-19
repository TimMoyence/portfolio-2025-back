/* eslint-disable @typescript-eslint/unbound-method */
import { FindOperator, Not } from 'typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';
import {
  buildBareme,
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import { SessionCodeAlreadyActiveError } from '../domain/errors/FormationErrors';
import type { FormationSessionEntity } from './entities/FormationSession.entity';
import { SessionsRepositoryTypeORM } from './Sessions.repository.typeorm';

const CODE = '4271';

function ligne(
  overrides: Partial<FormationSessionEntity> = {},
): FormationSessionEntity {
  return {
    id: 'session-ouverte',
    courseSlug: 'b1-09-interets-composes',
    courseVersion: 1,
    teacherId: 'teacher-uuid',
    code: CODE,
    etat: 'attente',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    bareme: buildBareme(),
    ouverteLe: new Date('2026-09-11T08:00:00.000Z'),
    fermeeLe: null,
    majLe: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Le double repond en fonction du `where` recu au lieu de le figer : un
 * `findOne` force a `null` laisse passer n importe quel filtre, donc
 * n importe quelle mutation de Sessions.repository.typeorm.ts.
 */
function satisfait(
  entite: FormationSessionEntity,
  where: FindOptionsWhere<FormationSessionEntity>,
): boolean {
  return Object.entries(where).every(([champ, critere]) => {
    const valeur: unknown = entite[champ as keyof FormationSessionEntity];
    if (critere instanceof FindOperator) {
      const operateur = critere.type as string;
      return operateur === 'not'
        ? valeur !== (critere.value as unknown)
        : false;
    }
    return valeur === (critere as unknown);
  });
}

describe('SessionsRepositoryTypeORM', () => {
  let table: FormationSessionEntity[];
  let repo: jest.Mocked<Repository<FormationSessionEntity>>;
  let sut: SessionsRepositoryTypeORM;

  type OptionsRecherche = { where?: FindOptionsWhere<FormationSessionEntity> };

  const filtrer = (options: OptionsRecherche): FormationSessionEntity[] =>
    table.filter((entite) => satisfait(entite, options.where ?? {}));

  beforeEach(() => {
    table = [];
    repo = {
      create: mockTypeOrmCreate(),
      save: mockTypeOrmSave({ id: 'session-uuid' }),
      findOne: jest.fn((options: OptionsRecherche) =>
        Promise.resolve(filtrer(options)[0] ?? null),
      ),
      count: jest.fn((options: OptionsRecherche) =>
        Promise.resolve(filtrer(options).length),
      ),
      update: jest.fn((id: string, patch: Partial<FormationSessionEntity>) => {
        const cible = table.find((entite) => entite.id === id);
        if (cible) {
          Object.assign(cible, patch);
        }
        return Promise.resolve({ affected: cible ? 1 : 0 });
      }),
    } as unknown as jest.Mocked<Repository<FormationSessionEntity>>;
    sut = new SessionsRepositoryTypeORM(repo);
  });

  const creerSession = () =>
    sut.create({
      courseSlug: 'b1-09-interets-composes',
      courseVersion: 1,
      teacherId: 'teacher-uuid',
      code: CODE,
      bareme: buildBareme(),
    });

  it('cree une session en attente', async () => {
    const session = await creerSession();
    expect(session.etat).toBe('attente');
    expect(session.code).toBe(CODE);
  });

  it('traduit la violation de uq_formation_sessions_code_active en conflit de code', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'uq_formation_sessions_code_active',
    });
    await expect(creerSession()).rejects.toBeInstanceOf(
      SessionCodeAlreadyActiveError,
    );
    await expect(creerSession()).rejects.toThrow(
      `Le code ${CODE} porte deja une seance active`,
    );
  });

  it('laisse passer une violation unique portee par une autre contrainte', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'uq_autre_contrainte_inconnue',
    });
    await expect(creerSession()).rejects.not.toBeInstanceOf(
      SessionCodeAlreadyActiveError,
    );
  });

  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    repo.save.mockRejectedValue(new Error('connexion perdue'));
    await expect(creerSession()).rejects.toThrow('connexion perdue');
  });

  it('retourne la session encore ouverte quand le code a deja servi', async () => {
    table = [
      ligne({ id: 'session-close', etat: 'terminee' }),
      ligne({ id: 'session-ouverte', etat: 'en_cours' }),
    ];

    const session = await sut.findActiveByCode(CODE);

    expect(session?.id).toBe('session-ouverte');
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { code: CODE, etat: Not('terminee') },
    });
  });

  it('ne retourne pas une session terminee sur recherche par code', async () => {
    table = [ligne({ id: 'session-close', etat: 'terminee' })];

    await expect(sut.findActiveByCode(CODE)).resolves.toBeNull();
  });

  it('retourne null quand aucune session ne porte le code', async () => {
    table = [ligne({ code: '8312', etat: 'en_cours' })];

    await expect(sut.findActiveByCode(CODE)).resolves.toBeNull();
  });

  it('signale un code deja pris par une session ouverte', async () => {
    table = [ligne({ etat: 'en_cours' })];

    await expect(sut.isCodeTaken(CODE)).resolves.toBe(true);
  });

  it('recycle le code d une session terminee', async () => {
    table = [ligne({ etat: 'terminee' })];

    await expect(sut.isCodeTaken(CODE)).resolves.toBe(false);
    expect(repo.count).toHaveBeenCalledWith({
      where: { code: CODE, etat: Not('terminee') },
    });
  });

  it('ecrit la mise a jour et rend la session relue', async () => {
    table = [ligne({ id: 'session-uuid', etat: 'attente' })];

    const session = await sut.update('session-uuid', {
      etat: 'en_cours',
      ecranCourant: 4,
    });

    expect(session.etat).toBe('en_cours');
    expect(session.ecranCourant).toBe(4);
    expect(table[0].etat).toBe('en_cours');
  });

  it('horodate chaque mise a jour', async () => {
    const avant = new Date('2026-09-11T08:00:00.000Z');
    table = [ligne({ id: 'session-uuid', majLe: avant })];

    const session = await sut.update('session-uuid', { ecranCourant: 1 });

    expect(session.majLe.getTime()).toBeGreaterThan(avant.getTime());
  });

  it('refuse de rendre une session disparue entre l ecriture et la relecture', async () => {
    table = [];

    await expect(
      sut.update('session-uuid', { ecranCourant: 1 }),
    ).rejects.toThrow(/session-uuid/);
  });
});
