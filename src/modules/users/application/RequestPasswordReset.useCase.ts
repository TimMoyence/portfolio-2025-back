import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { emettreJeton } from '../domain/TokenHash';
import type { IPasswordResetNotifier } from '../domain/IPasswordResetNotifier';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import type { RequestPasswordResetCommand } from './dto/RequestPasswordReset.command';
import { lienAvecJeton } from '../../../common/domain/lien-avec-jeton';

export interface RequestPasswordResetResult {
  message: string;
}

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);
  private readonly genericMessage =
    'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.';
  private readonly resetPasswordUrlBase: string;

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokensRepository: IPasswordResetTokensRepository,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly passwordResetNotifier: IPasswordResetNotifier,
    private readonly configService: ConfigService,
  ) {
    this.resetPasswordUrlBase = this.configService.get<string>(
      'PASSWORD_RESET_URL_BASE',
      'https://asilidesign.fr/reset-password',
    );
  }

  async execute(
    dto: RequestPasswordResetCommand,
  ): Promise<RequestPasswordResetResult> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user || !user.isActive || !user.id || !user.passwordHash) {
      return { message: this.genericMessage };
    }

    const jeton = emettreJeton();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetTokensRepository.invalidateActiveByUserId(user.id);
    await this.passwordResetTokensRepository.create({
      userId: user.id,
      tokenHash: jeton.empreinte,
      expiresAt,
      usedAt: null,
    });

    try {
      await this.passwordResetNotifier.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        resetUrl: lienAvecJeton(this.resetPasswordUrlBase, jeton.brut),
        expiresInMinutes: 60,
      });
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${user.email}: ${String(error)}`,
      );
    }

    return { message: this.genericMessage };
  }
}
