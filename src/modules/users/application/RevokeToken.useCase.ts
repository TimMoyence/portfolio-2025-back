import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY } from '../domain/token';

/**
 * Revoque un refresh token (logout).
 * Pour une securite maximale, revoque tous les tokens de l'utilisateur.
 */
@Injectable()
export class RevokeTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const tokenHash = TokenHash.fromRaw(rawRefreshToken).value;
    const stored = await this.refreshTokensRepo.findByTokenHash(tokenHash);

    if (!stored) {
      throw new InvalidCredentialsError('Invalid refresh token');
    }

    // Revoquer tous les tokens de l'utilisateur pour une securite maximale
    await this.refreshTokensRepo.revokeByUserId(stored.userId);
  }
}
