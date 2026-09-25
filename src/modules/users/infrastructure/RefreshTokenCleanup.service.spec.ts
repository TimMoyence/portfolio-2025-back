/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { RefreshTokenCleanupService } from './RefreshTokenCleanup.service';
import { REFRESH_TOKENS_REPOSITORY } from '../domain/token';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';

describe('RefreshTokenCleanupService', () => {
  let service: RefreshTokenCleanupService;
  let repo: jest.Mocked<IRefreshTokensRepository>;

  beforeEach(async () => {
    repo = createMockRefreshTokensRepo();

    const module = await Test.createTestingModule({
      providers: [
        RefreshTokenCleanupService,
        { provide: REFRESH_TOKENS_REPOSITORY, useValue: repo },
      ],
    }).compile();

    service = module.get(RefreshTokenCleanupService);
  });

  it('devrait etre defini', () => {
    expect(service).toBeDefined();
  });

  describe('purgeExpiredTokens', () => {
    it('devrait appeler purgeExpired sur le repository', async () => {
      repo.purgeExpired.mockResolvedValue(5);

      await service.purgeExpiredTokens();

      expect(repo.purgeExpired).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['devrait logger le nombre de tokens purges', 12],
      ['devrait logger zero quand aucun token n est purge', 0],
    ])('%s', async (_titre, purges) => {
      repo.purgeExpired.mockResolvedValue(purges);
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.purgeExpiredTokens();

      expect(logSpy).toHaveBeenCalledWith(
        `Purgé ${purges} refresh token(s) expiré(s)`,
      );
      logSpy.mockRestore();
    });

    it('devrait propager l erreur si purgeExpired echoue', async () => {
      repo.purgeExpired.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.purgeExpiredTokens()).rejects.toThrow(
        'DB connection lost',
      );
    });
  });
});
