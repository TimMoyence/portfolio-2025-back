import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import { jetonDeLien } from '../../../common/domain/lien-avec-jeton';
import { FORME_D_UN_JETON_EMIS, TokenHash } from '../domain/TokenHash';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  PASSWORD_RESET_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import type { ResetPasswordCommand } from './dto/ResetPassword.command';
import { PasswordService } from './services/PasswordService';

export interface ResetPasswordResult {
  message: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokensRepository: IPasswordResetTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: ResetPasswordCommand): Promise<ResetPasswordResult> {
    const tokenHash = TokenHash.fromRaw(
      jetonDeLien(dto.token, FORME_D_UN_JETON_EMIS),
    ).value;
    const token =
      await this.passwordResetTokensRepository.findActiveByTokenHash(tokenHash);

    if (!token || !token.id) {
      throw new LienInvalideError();
    }

    const user = await this.usersRepository.findById(token.userId);

    if (!user || !user.isActive || !user.id) {
      throw new LienInvalideError();
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    await this.usersRepository.update(user.id, {
      passwordHash,
      updatedAt: new Date(),
      updatedOrCreatedBy: 'password-reset',
    });
    await this.passwordResetTokensRepository.markUsed(token.id);

    return {
      message: 'Mot de passe reinitialise avec succes.',
    };
  }
}
