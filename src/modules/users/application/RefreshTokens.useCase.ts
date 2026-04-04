import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import type { AuthResult } from './AuthenticateUser.useCase';
import { JwtTokenService } from './services/JwtTokenService';

/** Duree de vie par defaut d'un refresh token : 30 jours en millisecondes. */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revoked) {
      // Detection de reutilisation : revoquer tous les tokens de l'utilisateur
      await this.refreshTokensRepo.revokeByUserId(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoquer l'ancien token (rotation)
    await this.refreshTokensRepo.revokeById(stored.id!);

    const user = await this.usersRepo.findById(stored.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
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
