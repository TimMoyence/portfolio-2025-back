/* eslint-disable @typescript-eslint/unbound-method */
import { FindOperator, Not } from 'typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';
import {
  mockTypeOrmUpdateBuilder,
  type PatchSimule,
} from '../../../../test/factories/formation-entities.factory';
import {
  buildBareme,
  buildSessionRecord,
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import { verifierPanneDEcritureTransmise } from '../../../../test/helpers/pannes-d-ecriture';
import { SessionCodeAlreadyActiveError } from '../domain/errors/FormationErrors';
import type { FormationSessionEntity } from './entities/FormationSession.entity';
import { SessionsRepositoryTypeORM } from './Sessions.repository.typeorm';

const CODE = '4271';

function ligne(
  overrides: Partial<FormationSessionEntity> = {},
): FormationSessionEntity {
  return {
    ...buildSessionRecord({
      id: 'session-ouverte',
      code: CODE,
      etat: 'attente',
    }),
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

  const appliquer = (id: string, patch: PatchSimule): number => {
    const cible = table.find((entite) => entite.id === id);
    if (!cible) {
      return 0;
    }
    const { revision, ...champs } = patch;
    Object.assign(cible, champs);
    if (typeof revision === 'function') {
      cible.revision += 1;
    }
    return 1;
  };

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
      createQueryBuilder: jest.fn(() => mockTypeOrmUpdateBuilder(appliquer)),
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

  verifierPanneDEcritureTransmise(() => ({
    save: repo.save,
    ecrire: creerSession,
  }));

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

  it('lit l etat d une seance sans charger son bareme', async () => {
    table = [ligne({ id: 'session-uuid', etat: 'en_cours', ecranCourant: 7 })];

    const etat = await sut.lireEtat('session-uuid');

    expect(etat).toEqual({
      etat: 'en_cours',
      modeRythme: 'pilote',
      ecranCourant: 7,
      intervalleLibre: null,
      pilotageEcrans: {},
      revision: 0,
      majLe: new Date('2026-09-11T08:00:00.000Z'),
    });
    const options = repo.findOne.mock.calls[0][0] as {
      select?: Record<string, boolean>;
    };
    expect(options.select).toBeDefined();
    expect(options.select?.bareme).toBeUndefined();
  });

  it('retourne null quand la seance dont on lit l etat n existe pas', async () => {
    await expect(sut.lireEtat('session-absente')).resolves.toBeNull();
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

  it('incremente la revision a chaque mise a jour', async () => {
    table = [ligne({ id: 'session-uuid', revision: 4 })];

    const session = await sut.update('session-uuid', { ecranCourant: 1 });

    expect(session.revision).toBe(5);
  });

  it('rend le pilotage par ecran enregistre', async () => {
    table = [ligne({ id: 'session-uuid' })];

    const session = await sut.update('session-uuid', {
      pilotageEcrans: { 'E-VOTE': { phase: 'revote' } },
    });

    expect(session.pilotageEcrans).toEqual({ 'E-VOTE': { phase: 'revote' } });
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
