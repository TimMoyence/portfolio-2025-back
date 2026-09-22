import type { Repository } from 'typeorm';
import { RefreshTokensRepositoryTypeORM } from './RefreshTokens.repository.typeORM';
import { RefreshTokenEntity } from './entities/RefreshToken.entity';

describe('RefreshTokensRepositoryTypeORM.rotateById', () => {
  it('indique que la rotation conditionnelle a ete appliquee', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const repository = new RefreshTokensRepositoryTypeORM({
      update,
    } as unknown as Repository<RefreshTokenEntity>);

    await expect(
      repository.rotateById('refresh-id', new Date('2026-09-22T12:00:00Z')),
    ).resolves.toBe(true);

    expect(update).toHaveBeenCalledWith(
      { id: 'refresh-id', revoked: false },
      {
        revoked: true,
        rotationGraceUntil: new Date('2026-09-22T12:00:00Z'),
      },
    );
  });

  it('indique qu’une rotation concurrente ou deja revoquee a echoue', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 0 });
    const repository = new RefreshTokensRepositoryTypeORM({
      update,
    } as unknown as Repository<RefreshTokenEntity>);

    await expect(
      repository.rotateById('refresh-id', new Date('2026-09-22T12:00:00Z')),
    ).resolves.toBe(false);
  });
});
