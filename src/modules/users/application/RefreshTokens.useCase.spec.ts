/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { RefreshTokensUseCase } from './RefreshTokens.useCase';
import type { JwtTokenService } from './services/JwtTokenService';
import {
  buildUser,
  createMockUsersRepo,
  createMockJwtService,
} from '../../../../test/factories/user.factory';
import {
  buildRefreshToken,
  createMockRefreshTokensRepo,
} from '../../../../test/factories/refresh-token.factory';

describe('RefreshTokensUseCase', () => {
  let refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: RefreshTokensUseCase;

  beforeEach(() => {
    refreshTokensRepo = createMockRefreshTokensRepo();
    usersRepo = createMockUsersRepo();
    jwtTokenService = createMockJwtService();
    jwtTokenService.sign.mockReturnValue({
      token: 'new-jwt-token',
      expiresIn: 900,
      expiresAt: 0,
    });

    useCase = new RefreshTokensUseCase(
      refreshTokensRepo,
      usersRepo,
      jwtTokenService,
    );
  });

  it('rafraichit le couple access + refresh token avec rotation', async () => {
    const stored = buildRefreshToken();
    const user = buildUser();
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);
    refreshTokensRepo.revokeById.mockResolvedValue(undefined);
    refreshTokensRepo.create.mockResolvedValue(
      buildRefreshToken({ id: 'rt-2' }),
    );
    usersRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute('raw-refresh-token');

    expect(refreshTokensRepo.findByTokenHash).toHaveBeenCalled();
    expect(refreshTokensRepo.revokeById).toHaveBeenCalledWith('rt-1');
    expect(refreshTokensRepo.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('new-jwt-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toBe(user);
  });

  it('lance UnauthorizedException quand le token est inexistant', async () => {
    refreshTokensRepo.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute('unknown-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revoque tous les tokens et lance UnauthorizedException quand le token est deja revoque (reutilisation)', async () => {
    const stored = buildRefreshToken({ revoked: true });
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);

    await expect(useCase.execute('reused-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(refreshTokensRepo.revokeByUserId).toHaveBeenCalledWith(
      stored.userId,
    );
  });

  it('lance UnauthorizedException quand le token est expire', async () => {
    const stored = buildRefreshToken({
      expiresAt: new Date(Date.now() - 1000),
    });
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);

    await expect(useCase.execute('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("lance UnauthorizedException quand l'utilisateur est introuvable ou inactif", async () => {
    const stored = buildRefreshToken();
    refreshTokensRepo.findByTokenHash.mockResolvedValue(stored);
    refreshTokensRepo.revokeById.mockResolvedValue(undefined);
    usersRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('valid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
