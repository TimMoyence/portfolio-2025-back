import { Inject, Injectable, type Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ValeursDeLEnv } from '../../../../config/env.validation';
import type { IPasswordResetNotifier } from '../../domain/IPasswordResetNotifier';
import type { IPasswordResetTokensRepository } from '../../domain/IPasswordResetTokens.repository';
import {
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
} from '../../domain/token';
import type { User } from '../../domain/User';
import { emettreUnLienTemporaire } from './emission-de-lien-temporaire';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const COURRIELS = {
  demande: {
    envoyer: 'sendPasswordResetEmail',
    echec: 'Password reset email failed',
  },
  'tentative-d-inscription': {
    envoyer: 'sendRegistrationAttemptEmail',
    echec: 'Registration attempt email failed',
  },
} as const satisfies Record<
  string,
  { envoyer: keyof IPasswordResetNotifier; echec: string }
>;

export type MotifDuLienDeReinitialisation = keyof typeof COURRIELS;

@Injectable()
export class EnvoiDeReinitialisation {
  private readonly adresseDeBase: string;

  constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly tokensRepo: IPasswordResetTokensRepository,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly notifier: IPasswordResetNotifier,
    configService: ConfigService<ValeursDeLEnv>,
  ) {
    this.adresseDeBase = configService.get<string>(
      'PASSWORD_RESET_URL_BASE',
      'https://asilidesign.fr/reset-password',
    );
  }

  async envoyer(
    titulaire: User | null,
    motif: MotifDuLienDeReinitialisation,
    logger: Logger,
  ): Promise<void> {
    if (!titulaire?.isActive || !titulaire.id || !titulaire.passwordHash) {
      return;
    }

    const courriel = COURRIELS[motif];
    await emettreUnLienTemporaire(
      titulaire,
      titulaire.id,
      {
        dureeDeValiditeMs: PASSWORD_RESET_TTL_MS,
        adresseDeBase: this.adresseDeBase,
        echecDEnvoi: courriel.echec,
        remplacerLesLiensActifs: (jeton, plafond) =>
          this.tokensRepo.remplacerLesJetonsActifs(jeton, plafond),
        envoyer: ({ url, ...envoi }) =>
          this.notifier[courriel.envoyer]({ ...envoi, resetUrl: url }),
      },
      logger,
    );
  }
}
