import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { TokenExpiredError } from '../../../common/domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../../common/domain/errors/TokenReuseDetectedError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import { REFRESH_TOKEN_ROTATION_GRACE_MS } from '../domain/auth.constants';
import type { AuthResult } from './AuthenticateUser.useCase';
import { issueAuthSession } from './services/issue-auth-session';
import { JwtTokenService } from './services/JwtTokenService';

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

    const maintenant = Date.now();
    if (
      stored.revoked &&
      stored.rotationGraceUntil !== null &&
      stored.rotationGraceUntil !== undefined &&
      stored.rotationGraceUntil.getTime() > maintenant
    ) {
      const user = await this.usersRepo.findById(stored.userId);
      if (!user || !user.isActive) {
        throw new InvalidCredentialsError('User not found or inactive');
      }
      return issueAuthSession(
        user,
        this.jwtTokenService,
        this.refreshTokensRepo,
      );
    }

    if (stored.revoked) {
      await this.refreshTokensRepo.revokeByUserId(stored.userId);
      throw new TokenReuseDetectedError('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new TokenExpiredError('Refresh token expired');
    }

    const rotationApplied = await this.refreshTokensRepo.rotateById(
      stored.id!,
      new Date(maintenant + REFRESH_TOKEN_ROTATION_GRACE_MS),
    );
    if (!rotationApplied) {
      throw new InvalidCredentialsError('Invalid refresh token');
    }

    const user = await this.usersRepo.findById(stored.userId);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError('User not found or inactive');
    }

    return issueAuthSession(user, this.jwtTokenService, this.refreshTokensRepo);
  }
}
