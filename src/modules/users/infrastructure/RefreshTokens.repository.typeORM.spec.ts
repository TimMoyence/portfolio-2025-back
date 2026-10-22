import type { Repository } from 'typeorm';
import {
  attendreLeVerrouDeTransaction,
  mockTypeOrmManager,
  mockTypeOrmRepositoryAvecManager,
} from '../../../../test/factories/formation-entities.factory';
import { SUCCESSEURS_MAX_D_UN_JETON } from '../domain/auth.constants';
import { RefreshTokensRepositoryTypeORM } from './RefreshTokens.repository.typeORM';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';

const VERROU_DU_COMPTE = 'refresh_tokens:user-1';

const depotSousVerrou = (methodes: Readonly<Record<string, jest.Mock>>) => {
  const manager = mockTypeOrmManager({
    query: jest.fn().mockResolvedValue([]),
    ...methodes,
  });
  return {
    manager,
    depot: new RefreshTokensRepositoryTypeORM(
      mockTypeOrmRepositoryAvecManager<RefreshTokenEntity>(
        {},
        manager,
        'refresh_tokens',
      ),
    ),
  };
};

describe('RefreshTokensRepositoryTypeORM.rotateById', () => {
  const GRACE = new Date('2026-09-22T12:00:00Z');

  const tournerAvec = (affected: number) => {
    const update = jest.fn().mockResolvedValue({ affected });
    const repository = new RefreshTokensRepositoryTypeORM({
      update,
    } as unknown as Repository<RefreshTokenEntity>);
    return { update, rotation: repository.rotateById('refresh-id', GRACE) };
  };

  it('indique que la rotation conditionnelle a ete appliquee', async () => {
    const { update, rotation } = tournerAvec(1);

    await expect(rotation).resolves.toBe(true);

    expect(update).toHaveBeenCalledWith(
      { id: 'refresh-id', revoked: false },
      { revoked: true, rotationGraceUntil: GRACE },
    );
  });

  it('indique qu’une rotation concurrente ou deja revoquee a echoue', async () => {
    await expect(tournerAvec(0).rotation).resolves.toBe(false);
  });
});

describe('RefreshTokensRepositoryTypeORM revocation et purge', () => {
  const depotSur = (ecritures: Partial<Repository<RefreshTokenEntity>>) =>
    new RefreshTokensRepositoryTypeORM(
      ecritures as Repository<RefreshTokenEntity>,
    );

  it('revoque tous les jetons d un compte et retire leur grace, sous le verrou du compte', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const { manager, depot } = depotSousVerrou({ update });

    await depot.revokeByUserId('user-1');

    attendreLeVerrouDeTransaction(manager, VERROU_DU_COMPTE);
    expect(update).toHaveBeenCalledWith(
      RefreshTokenEntity,
      { userId: 'user-1' },
      { revoked: true, rotationGraceUntil: null },
    );
    expect(manager.query.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
  });

  it('rend le nombre de jetons purges', async () => {
    const remove = jest.fn().mockResolvedValue({ affected: 3, raw: [] });

    await expect(depotSur({ delete: remove }).purgeExpired()).resolves.toBe(3);
    expect(remove).toHaveBeenCalledWith([
      {
        revoked: true,
        createdAt: expect.objectContaining({
          type: 'raw',
          objectLiteralParameters: { ancienneteEnSecondes: 7 * 24 * 60 * 60 },
        }),
      },
      { expiresAt: expect.objectContaining({ type: 'lessThan' }) },
    ]);
  });
});

describe('RefreshTokensRepositoryTypeORM.createSuccessor', () => {
  const expiresAt = new Date('2026-10-17T12:00:00Z');
  const createdAt = new Date('2026-10-10T12:00:00Z');

  const succederA = (precedent: object | null) => {
    const findOne = jest.fn().mockResolvedValue(precedent);
    const create = jest.fn((_cible: unknown, champs: object) => champs);
    const save = jest.fn((entite: object) =>
      Promise.resolve({ ...entite, id: 'refresh-2', createdAt }),
    );
    const increment = jest.fn().mockResolvedValue({ affected: 1 });
    const { manager, depot } = depotSousVerrou({
      findOne,
      create,
      save,
      increment,
    });
    const succession = depot.createSuccessor('refresh-1', {
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      revoked: false,
    });
    return { findOne, save, increment, manager, succession };
  };

  it('enregistre le suivant sous le verrou du compte quand le precedent est encore en grace', async () => {
    const { findOne, save, increment, manager, succession } = succederA({
      id: 'refresh-1',
      successeursEmis: SUCCESSEURS_MAX_D_UN_JETON - 1,
    });

    await expect(succession).resolves.toEqual({
      id: 'refresh-2',
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      revoked: false,
      rotationGraceUntil: null,
      createdAt,
    });
    attendreLeVerrouDeTransaction(manager, VERROU_DU_COMPTE);
    expect(findOne).toHaveBeenCalledWith(RefreshTokenEntity, {
      where: {
        id: 'refresh-1',
        userId: 'user-1',
        rotationGraceUntil: expect.objectContaining({ type: 'not' }),
      },
    });
    expect(manager.query.mock.invocationCallOrder[0]).toBeLessThan(
      findOne.mock.invocationCallOrder[0],
    );
    expect(findOne.mock.invocationCallOrder[0]).toBeLessThan(
      save.mock.invocationCallOrder[0],
    );
    expect(increment).toHaveBeenCalledWith(
      RefreshTokenEntity,
      { id: 'refresh-1' },
      'successeursEmis',
      1,
    );
    expect(increment.mock.invocationCallOrder[0]).toBeLessThan(
      save.mock.invocationCallOrder[0],
    );
  });

  it('n enregistre rien quand une deconnexion a retire la grace du precedent', async () => {
    const { save, succession } = succederA(null);

    await expect(succession).resolves.toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('n enregistre plus rien quand le precedent a deja engendre le nombre maximal de successeurs', async () => {
    const { save, increment, succession } = succederA({
      id: 'refresh-1',
      successeursEmis: SUCCESSEURS_MAX_D_UN_JETON,
    });

    await expect(succession).resolves.toBeNull();
    expect(increment).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});

describe('RefreshTokensRepositoryTypeORM.create', () => {
  it('enregistre l empreinte, l etat de revocation et la grace, puis rend le jeton persiste', async () => {
    const expiresAt = new Date('2026-10-17T12:00:00Z');
    const createdAt = new Date('2026-10-10T12:00:00Z');
    const create = jest.fn((champs: object) => champs);
    const save = jest.fn((entite: object) =>
      Promise.resolve({ ...entite, id: 'refresh-id', createdAt }),
    );
    const repository = new RefreshTokensRepositoryTypeORM({
      create,
      save,
    } as unknown as Repository<RefreshTokenEntity>);

    const enregistre = await repository.create({
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      revoked: false,
    });

    expect(create).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      revoked: false,
      rotationGraceUntil: null,
    });
    expect(enregistre).toEqual({
      id: 'refresh-id',
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      revoked: false,
      rotationGraceUntil: null,
      createdAt,
    });
  });
});
