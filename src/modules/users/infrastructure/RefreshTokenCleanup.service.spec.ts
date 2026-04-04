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
      // Arrange
      repo.purgeExpired.mockResolvedValue(5);

      // Act
      await service.purgeExpiredTokens();

      // Assert
      expect(repo.purgeExpired).toHaveBeenCalledTimes(1);
    });

    it('devrait logger le nombre de tokens purges', async () => {
      // Arrange
      repo.purgeExpired.mockResolvedValue(12);
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      // Act
      await service.purgeExpiredTokens();

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Purgé 12 refresh token(s) expiré(s)',
      );
      logSpy.mockRestore();
    });

    it('devrait logger zero quand aucun token n est purge', async () => {
      // Arrange
      repo.purgeExpired.mockResolvedValue(0);
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      // Act
      await service.purgeExpiredTokens();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Purgé 0 refresh token(s) expiré(s)');
      logSpy.mockRestore();
    });

    it('devrait propager l erreur si purgeExpired echoue', async () => {
      // Arrange
      repo.purgeExpired.mockRejectedValue(new Error('DB connection lost'));

      // Act & Assert
      await expect(service.purgeExpiredTokens()).rejects.toThrow(
        'DB connection lost',
      );
    });
  });
});
