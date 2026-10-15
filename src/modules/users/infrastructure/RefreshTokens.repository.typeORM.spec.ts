import type { Repository } from 'typeorm';
import { RefreshTokensRepositoryTypeORM } from './RefreshTokens.repository.typeORM';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';

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

  it.each([
    [
      'tous les jetons d un compte',
      (depot: RefreshTokensRepositoryTypeORM) => depot.revokeByUserId('user-1'),
      { userId: 'user-1' },
    ],
    [
      'un seul jeton',
      (depot: RefreshTokensRepositoryTypeORM) => depot.revokeById('refresh-id'),
      { id: 'refresh-id' },
    ],
  ])('revoque %s et retire sa grace', async (_label, revoquer, critere) => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });

    await revoquer(depotSur({ update }));

    expect(update).toHaveBeenCalledWith(critere, {
      revoked: true,
      rotationGraceUntil: null,
    });
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
