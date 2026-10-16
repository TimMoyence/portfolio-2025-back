import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../../domain/IEmailVerificationTokens.repository';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
} from '../../domain/token';
import type { User } from '../../domain/User';
import { emettreUnLienTemporaire } from './emission-de-lien-temporaire';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

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

  envoyer(
    user: User,
    userId: string,
    logger: Logger,
    failureLogPrefix: string,
  ): Promise<void> {
    return emettreUnLienTemporaire(
      user,
      userId,
      {
        dureeDeValiditeMs: EMAIL_VERIFICATION_TTL_MS,
        adresseDeBase: this.verificationUrlBase,
        echecDEnvoi: failureLogPrefix,
        invaliderLesLiensActifs: (id) =>
          this.tokensRepo.invalidateActiveByUserId(id),
        enregistrer: (jeton) => this.tokensRepo.create(jeton),
        envoyer: ({ url, ...envoi }) =>
          this.notifier.sendVerificationEmail({
            ...envoi,
            verificationUrl: url,
          }),
      },
      logger,
    );
  }
}
