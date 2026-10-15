/* eslint-disable @typescript-eslint/unbound-method */
import { itRefuseUnRefreshTokenInconnu } from '../../../../test/helpers/utilisateurs';
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

  it.each([
    ['actif', {}],
    [
      'en delai de grace',
      { revoked: true, rotationGraceUntil: new Date(Date.now() + 30_000) },
    ],
    [
      'remplace par rotation',
      { revoked: true, rotationGraceUntil: new Date(Date.now() - 1) },
    ],
  ])(
    "revoque tous les tokens de l'utilisateur lors du logout avec un token %s",
    async (_etat, champs) => {
      const stored = buildRefreshToken(champs);
      refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);
      refreshTokensRepo.revokeByUserId.mockResolvedValue(undefined);

      await useCase.execute('raw-refresh-token');

      expect(refreshTokensRepo.findByTokenHash).toHaveBeenCalled();
      expect(refreshTokensRepo.revokeByUserId).toHaveBeenCalledWith(
        stored.userId,
      );
    },
  );

  it('ne ferme aucune session ouverte depuis quand le token presente est deja revoque hors rotation', async () => {
    refreshTokensRepo.findByTokenHash.mockResolvedValue(
      buildRefreshToken({ revoked: true, rotationGraceUntil: null }),
    );

    await useCase.execute('stale-refresh-token');

    expect(refreshTokensRepo.revokeByUserId).not.toHaveBeenCalled();
  });

  itRefuseUnRefreshTokenInconnu(() => ({ refreshTokensRepo, useCase }));
});
