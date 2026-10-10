import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../../domain/IEmailVerificationTokens.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
} from '../../domain/token';
import { emettreJeton } from '../../domain/TokenHash';
import type { User } from '../../domain/User';
import { lienAvecJeton } from './lien-avec-jeton';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const EMAIL_VERIFICATION_TTL_MINUTES = EMAIL_VERIFICATION_TTL_MS / 60_000;

@Injectable()
export class EnvoiDeVerificationEmail {
  private readonly verificationUrlBase: string;

  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly tokensRepo: IEmailVerificationTokensRepository,
    @Inject(EMAIL_VERIFICATION_NOTIFIER)
    private readonly notifier: IEmailVerificationNotifier,
    configService: ConfigService,
  ) {
    this.verificationUrlBase = configService.get<string>(
      'EMAIL_VERIFICATION_URL_BASE',
      'https://asilidesign.fr/verify-email',
    );
  }

  async envoyer(
    user: User,
    userId: string,
    logger: Logger,
    failureLogPrefix: string,
  ): Promise<void> {
    const jeton = emettreJeton();

    await this.tokensRepo.create({
      userId,
      tokenHash: jeton.empreinte,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    try {
      await this.notifier.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationUrl: lienAvecJeton(this.verificationUrlBase, jeton.brut),
        expiresInMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
      });
    } catch (error) {
      logger.error(`${failureLogPrefix} for ${user.email}: ${String(error)}`);
    }
  }
}
