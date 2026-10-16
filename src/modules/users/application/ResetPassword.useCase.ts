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
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { ResetPasswordCommand } from './dto/ResetPassword.command';
import { PasswordService } from './services/PasswordService';

export interface ResetPasswordResult {
  message: string;
  userId: string;
}

@Injectable()
export class ResetPasswordUseCase extends CasDUsageMotDePasse {
  constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokensRepository: IPasswordResetTokensRepository,
    @Inject(USERS_REPOSITORY)
    repo: IUsersRepository,
    passwordService: PasswordService,
  ) {
    super(repo, passwordService);
  }

  async execute(dto: ResetPasswordCommand): Promise<ResetPasswordResult> {
    const tokenHash = TokenHash.fromRaw(
      jetonDeLien(dto.token, FORME_D_UN_JETON_EMIS),
    ).value;
    const token =
      await this.passwordResetTokensRepository.findActiveByTokenHash(tokenHash);

    if (!token || !token.id) {
      throw new LienInvalideError();
    }

    const user = await this.repo.findById(token.userId);

    if (!user || !user.isActive || !user.id) {
      throw new LienInvalideError();
    }

    if (!(await this.passwordResetTokensRepository.markUsed(token.id))) {
      throw new LienInvalideError();
    }
    await this.enregistrerMotDePasse(user, dto.newPassword, 'password-reset');

    return {
      message: 'Mot de passe reinitialise avec succes.',
      userId: user.id,
    };
  }
}
