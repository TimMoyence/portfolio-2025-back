import { Inject, Injectable } from '@nestjs/common';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import { estRevoqueHorsRotation } from '../domain/RefreshToken';
import { REFRESH_TOKENS_REPOSITORY } from '../domain/token';
import { jetonDeRafraichissementConnu } from './services/issue-auth-session';

@Injectable()
export class RevokeTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const stored = await jetonDeRafraichissementConnu(
      this.refreshTokensRepo,
      rawRefreshToken,
    );
    if (estRevoqueHorsRotation(stored)) return;
    await this.refreshTokensRepo.revokeByUserId(stored.userId);
  }
}
