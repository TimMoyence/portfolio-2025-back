import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IPasswordResetNotifier } from '../domain/IPasswordResetNotifier';
import type { IPasswordResetTokensRepository } from '../domain/IPasswordResetTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import type { RequestPasswordResetCommand } from './dto/RequestPasswordReset.command';
import { emettreUnLienTemporaire } from './services/emission-de-lien-temporaire';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

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

    await emettreUnLienTemporaire(
      user,
      user.id,
      {
        dureeDeValiditeMs: PASSWORD_RESET_TTL_MS,
        adresseDeBase: this.resetPasswordUrlBase,
        echecDEnvoi: 'Password reset email failed',
        invaliderLesLiensActifs: (id) =>
          this.passwordResetTokensRepository.invalidateActiveByUserId(id),
        enregistrer: (jeton) =>
          this.passwordResetTokensRepository.create({
            ...jeton,
            usedAt: null,
          }),
        envoyer: ({ url, ...envoi }) =>
          this.passwordResetNotifier.sendPasswordResetEmail({
            ...envoi,
            resetUrl: url,
          }),
      },
      this.logger,
    );

    return { message: this.genericMessage };
  }
}
