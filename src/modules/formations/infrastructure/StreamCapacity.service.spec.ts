import { sousEnvironnement } from '../../../../test/helpers/environnement';
import { StreamCapacityService } from './StreamCapacity.service';

const SANS_REDIS = {
  REDIS_URL: undefined,
  REDIS_HOST: undefined,
  REDIS_PORT: undefined,
};

describe('StreamCapacityService sans Redis', () => {
  it('n impose aucun plafond partage lorsqu aucune configuration Redis n est fournie', async () => {
    await sousEnvironnement(SANS_REDIS, async () => {
      const sut = new StreamCapacityService();

      await expect(
        sut.acquire({ places: [{ key: 'session', limit: 1 }] }),
      ).resolves.toBeNull();
      await expect(
        sut.refresh({ token: 'token', keys: ['key'] }),
      ).resolves.toBeUndefined();
      await expect(
        sut.release({ token: 'token', keys: ['key'] }),
      ).resolves.toBeUndefined();
      await expect(sut.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
