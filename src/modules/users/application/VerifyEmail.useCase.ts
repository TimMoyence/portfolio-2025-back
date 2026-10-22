import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { DEFAULT_SELF_REGISTRATION_ROLES } from '../domain/roles';
import { TokenHash } from '../../../common/domain/crypto/TokenHash';
import { User } from '../domain/User';
import {
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';

export interface VerifyEmailResult {
  message: string;
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepo: IEmailVerificationTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
  ) {}

  async execute(token: string): Promise<VerifyEmailResult> {
    const stored = await this.emailVerificationTokensRepo.findActiveByTokenHash(
      TokenHash.fromRaw(token).value,
    );

    if (!stored) {
      throw new LienInvalideError();
    }

    const user = await this.usersRepo.findById(stored.userId);

    if (!user) {
      throw new LienInvalideError();
    }

    if (user.emailVerified) {
      await this.emailVerificationTokensRepo.deleteByUserId(stored.userId);
      return { message: 'Adresse email deja verifiee.' };
    }

    await this.usersRepo.update(
      stored.userId,
      User.update({
        emailVerified: true,
        roles: [...DEFAULT_SELF_REGISTRATION_ROLES],
      }),
    );

    await this.refreshTokensRepo.revokeByUserId(stored.userId);
    await this.emailVerificationTokensRepo.deleteByUserId(stored.userId);

    return { message: 'Adresse email verifiee avec succes.' };
  }
}
