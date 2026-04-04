/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import { RevokeTokenUseCase } from './RevokeToken.useCase';
import {
  buildRefreshToken,
  createMockRefreshTokensRepo,
} from '../../../../test/factories/refresh-token.factory';

describe('RevokeTokenUseCase', () => {
  let refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
  let useCase: RevokeTokenUseCase;

  beforeEach(() => {
    refreshTokensRepo = createMockRefreshTokensRepo();
    useCase = new RevokeTokenUseCase(refreshTokensRepo);
  });

  it("revoque tous les tokens de l'utilisateur lors du logout", async () => {
    const stored = buildRefreshToken();
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);
    refreshTokensRepo.revokeByUserId.mockResolvedValue(undefined);

    await useCase.execute('raw-refresh-token');

    expect(refreshTokensRepo.findByTokenHash).toHaveBeenCalled();
    expect(refreshTokensRepo.revokeByUserId).toHaveBeenCalledWith(
      stored.userId,
    );
  });

  it('lance InvalidCredentialsError quand le token est inexistant', async () => {
    refreshTokensRepo.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute('unknown-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });
});
