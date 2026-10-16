import { IsNull, type Repository } from 'typeorm';
import {
  mockTypeOrmManager,
  mockTypeOrmRepositoryAvecManager,
} from '../../../../test/factories/formation-entities.factory';
import { TROIS_ENVOIS_PAR_HEURE } from '../domain/PlafondDEnvois';
import { PasswordResetTokenEntity } from './entities/PasswordResetToken.entity';
import { PasswordResetTokensRepositoryTypeORM } from './PasswordResetTokens.repository.typeORM';

describe('PasswordResetTokensRepositoryTypeORM marquage d usage', () => {
  const MARQUAGE = { usedAt: expect.any(Date), updatedAt: expect.any(Date) };

  const depotRendant = (affected: number) => {
    const update = jest.fn().mockResolvedValue({ affected });
    const depot = new PasswordResetTokensRepositoryTypeORM({
      update,
    } as unknown as Repository<PasswordResetTokenEntity>);
    return { update, depot };
  };

  it('ne marque le jeton utilise que s il ne l etait pas encore', async () => {
    const { update, depot } = depotRendant(1);

    await expect(depot.markUsed('reset-1')).resolves.toBe(true);

    expect(update).toHaveBeenCalledWith(
      { id: 'reset-1', usedAt: IsNull() },
      MARQUAGE,
    );
  });

  it('indique qu un usage concurrent a deja consomme le jeton', async () => {
    await expect(depotRendant(0).depot.markUsed('reset-1')).resolves.toBe(
      false,
    );
  });

  const depotSousVerrou = (envoisRecents: number) => {
    const query = jest.fn().mockResolvedValue([]);
    const countBy = jest.fn().mockResolvedValue(envoisRecents);
    const update = jest.fn().mockResolvedValue({ affected: 2 });
    const create = jest.fn((champs: object) => champs);
    const save = jest.fn((entite: object) =>
      Promise.resolve({ ...entite, id: 'reset-token-2' }),
    );
    const manager = mockTypeOrmManager({
      query,
      withRepository: jest
        .fn()
        .mockReturnValue({ countBy, update, create, save }),
    });
    const depot = new PasswordResetTokensRepositoryTypeORM(
      mockTypeOrmRepositoryAvecManager<PasswordResetTokenEntity>(
        {},
        manager,
        'password_reset_tokens',
      ),
    );
    return { query, countBy, update, create, save, manager, depot };
  };
  const expiresAt = new Date('2026-10-16T12:00:00.000Z');
  const remplacer = (depot: PasswordResetTokensRepositoryTypeORM) =>
    depot.remplacerLesJetonsActifs(
      { userId: 'user-1', tokenHash: 'empreinte', expiresAt },
      TROIS_ENVOIS_PAR_HEURE,
    );

  it('n invalide ni n enregistre rien quand le compte a deja recu trois liens dans l heure', async () => {
    const { query, countBy, update, save, depot } = depotSousVerrou(3);

    await expect(remplacer(depot)).resolves.toBeNull();

    expect(countBy).toHaveBeenCalledWith({
      userId: 'user-1',
      createdAt: expect.objectContaining({ type: 'raw' }),
    });
    expect(query.mock.invocationCallOrder[0]).toBeLessThan(
      countBy.mock.invocationCallOrder[0],
    );
    expect(update).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('marque utilises les jetons encore actifs d un compte puis enregistre le neuf, sous le verrou du compte et dans une seule transaction', async () => {
    const { query, countBy, update, create, save, manager, depot } =
      depotSousVerrou(2);

    const remplace = await remplacer(depot);

    expect(manager.transaction).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      ['password_reset_tokens:user-1'],
    );
    expect(countBy.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
    expect(update).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        usedAt: IsNull(),
        expiresAt: expect.objectContaining({ type: 'moreThan' }),
      },
      MARQUAGE,
    );
    expect(create).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      usedAt: null,
    });
    expect(query.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      save.mock.invocationCallOrder[0],
    );
    expect(remplace).toMatchObject({
      id: 'reset-token-2',
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
      usedAt: null,
    });
  });
});
