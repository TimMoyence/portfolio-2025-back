import { IsNull, type Repository } from 'typeorm';
import {
  mockTypeOrmManager,
  mockTypeOrmRepositoryAvecManager,
} from '../../../../test/factories/formation-entities.factory';
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

  it('marque utilises les jetons encore actifs d un compte puis enregistre le neuf, sous le verrou du compte et dans une seule transaction', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const update = jest.fn().mockResolvedValue({ affected: 2 });
    const create = jest.fn((champs: object) => champs);
    const save = jest.fn((entite: object) =>
      Promise.resolve({ ...entite, id: 'reset-token-2' }),
    );
    const manager = mockTypeOrmManager({
      query,
      withRepository: jest.fn().mockReturnValue({ update, create, save }),
    });
    const depot = new PasswordResetTokensRepositoryTypeORM(
      mockTypeOrmRepositoryAvecManager<PasswordResetTokenEntity>(
        {},
        manager,
        'password_reset_tokens',
      ),
    );
    const expiresAt = new Date('2026-10-16T12:00:00.000Z');

    const remplace = await depot.remplacerLesJetonsActifs({
      userId: 'user-1',
      tokenHash: 'empreinte',
      expiresAt,
    });

    expect(manager.transaction).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      ['password_reset_tokens:user-1'],
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
