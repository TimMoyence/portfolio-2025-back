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
