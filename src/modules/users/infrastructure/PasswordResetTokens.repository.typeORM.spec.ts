import { IsNull, type Repository } from 'typeorm';
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

  it('marque utilises les jetons encore actifs d un compte', async () => {
    const { update, depot } = depotRendant(2);

    await depot.invalidateActiveByUserId('user-1');

    expect(update).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        usedAt: IsNull(),
        expiresAt: expect.objectContaining({ type: 'moreThan' }),
      },
      MARQUAGE,
    );
  });
});
