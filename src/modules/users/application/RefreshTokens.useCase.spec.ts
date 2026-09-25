/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { TokenExpiredError } from '../../../common/domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../../common/domain/errors/TokenReuseDetectedError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { RefreshToken } from '../domain/RefreshToken';
import { RefreshTokensUseCase } from './RefreshTokens.useCase';
import type { JwtTokenService } from './services/JwtTokenService';
import {
  buildSignedToken,
  buildUser,
  createMockUsersRepo,
  createMockJwtService,
} from '../../../../test/factories/user.factory';
import {
  buildRefreshToken,
  createMockRefreshTokensRepo,
} from '../../../../test/factories/refresh-token.factory';
import { itRefuseUnRefreshTokenInconnu } from '../../../../test/helpers/utilisateurs';

describe('RefreshTokensUseCase', () => {
  let refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: RefreshTokensUseCase;

  beforeEach(() => {
    refreshTokensRepo = createMockRefreshTokensRepo();
    usersRepo = createMockUsersRepo();
    jwtTokenService = createMockJwtService();
    jwtTokenService.sign.mockResolvedValue(
      buildSignedToken({ token: 'new-jwt-token' }),
    );

    useCase = new RefreshTokensUseCase(
      refreshTokensRepo,
      usersRepo,
      jwtTokenService,
    );
  });

  const rafraichir = async (stored: RefreshToken, token: string) => {
    const user = buildUser();
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);
    refreshTokensRepo.create.mockResolvedValue(
      buildRefreshToken({ id: 'rt-2' }),
    );
    usersRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute(token);

    expect(result.user).toBe(user);
    expect(refreshTokensRepo.create).toHaveBeenCalled();
    return result;
  };

  it('rafraichit le couple access + refresh token avec rotation', async () => {
    refreshTokensRepo.rotateById.mockResolvedValue(true);

    const result = await rafraichir(buildRefreshToken(), 'raw-refresh-token');

    expect(refreshTokensRepo.findByTokenHash).toHaveBeenCalled();
    expect(refreshTokensRepo.rotateById).toHaveBeenCalledWith(
      'rt-1',
      expect.any(Date),
    );
    expect(result.accessToken).toBe('new-jwt-token');
    expect(result.refreshToken).toBeDefined();
  });

  it('refuse de creer une session si une autre requete a deja gagne la rotation', async () => {
    refreshTokensRepo.findByTokenHash.mockResolvedValue(buildRefreshToken());
    refreshTokensRepo.rotateById.mockResolvedValue(false);

    await expect(
      useCase.execute('racing-refresh-token'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(usersRepo.findById).not.toHaveBeenCalled();
    expect(refreshTokensRepo.create).not.toHaveBeenCalled();
  });

  itRefuseUnRefreshTokenInconnu(() => ({ refreshTokensRepo, useCase }));

  it.each([
    [
      'revoque tous les tokens et lance TokenReuseDetectedError quand le token est deja revoque (reutilisation)',
      () => ({}),
      'reused-token',
    ],
    [
      'revoque la session quand le delai de grace est depasse',
      () => ({ rotationGraceUntil: new Date(Date.now() - 1) }),
      'late-replay',
    ],
  ])('%s', async (_titre, grace, token) => {
    const stored = buildRefreshToken({ revoked: true, ...grace() });
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);

    await expect(useCase.execute(token)).rejects.toBeInstanceOf(
      TokenReuseDetectedError,
    );
    expect(refreshTokensRepo.revokeByUserId).toHaveBeenCalledWith(
      stored.userId,
    );
  });

  it('lance TokenExpiredError quand le token est expire', async () => {
    const stored = buildRefreshToken({
      expiresAt: new Date(Date.now() - 1000),
    });
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);

    await expect(useCase.execute('expired-token')).rejects.toBeInstanceOf(
      TokenExpiredError,
    );
  });

  it('accepte une nouvelle tentative pendant le delai de grace apres une reponse perdue', async () => {
    await rafraichir(
      buildRefreshToken({
        revoked: true,
        rotationGraceUntil: new Date(Date.now() + 30_000),
      }),
      'retry-after-lost-response',
    );

    expect(refreshTokensRepo.revokeByUserId).not.toHaveBeenCalled();
    expect(refreshTokensRepo.rotateById).not.toHaveBeenCalled();
  });

  it("lance InvalidCredentialsError quand l'utilisateur est introuvable ou inactif", async () => {
    refreshTokensRepo.findByTokenHash.mockResolvedValue(buildRefreshToken());
    refreshTokensRepo.rotateById.mockResolvedValue(true);
    usersRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('valid-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });
});
