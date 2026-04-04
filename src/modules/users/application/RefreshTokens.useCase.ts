import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { TokenExpiredError } from '../../../common/domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../../common/domain/errors/TokenReuseDetectedError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import { REFRESH_TOKEN_TTL_MS } from '../domain/auth.constants';
import type { AuthResult } from './AuthenticateUser.useCase';
import { JwtTokenService } from './services/JwtTokenService';

/**
 * Rafraichit un couple access + refresh token avec rotation.
 * L'ancien refresh token est revoque et un nouveau couple est emis.
 */
@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(rawRefreshToken: string): Promise<AuthResult> {
    const tokenHash = TokenHash.fromRaw(rawRefreshToken).value;
    const stored = await this.refreshTokensRepo.findByTokenHash(tokenHash);

    if (!stored) {
      throw new InvalidCredentialsError('Invalid refresh token');
    }

    if (stored.revoked) {
      // Detection de reutilisation : revoquer tous les tokens de l'utilisateur
      await this.refreshTokensRepo.revokeByUserId(stored.userId);
      throw new TokenReuseDetectedError('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new TokenExpiredError('Refresh token expired');
    }

    // Revoquer l'ancien token (rotation)
    await this.refreshTokensRepo.revokeById(stored.id!);

    const user = await this.usersRepo.findById(stored.userId);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError('User not found or inactive');
    }

    // Generer un nouveau couple access + refresh
    const { token, expiresIn } = await this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [],
    });

    const newRawRefreshToken = randomBytes(32).toString('hex');
    const newTokenHash = TokenHash.fromRaw(newRawRefreshToken).value;

    await this.refreshTokensRepo.create({
      userId: user.id!,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revoked: false,
    });

    return {
      accessToken: token,
      expiresIn,
      refreshToken: newRawRefreshToken,
      user,
    };
  }
}
