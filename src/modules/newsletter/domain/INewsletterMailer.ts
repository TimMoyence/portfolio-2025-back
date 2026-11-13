import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';

export interface ConfirmationAEnvoyer {
  readonly email: string;
  readonly locale: SupportedLocale;
  readonly jeton: string;
  readonly expireLe: Date;
}

export interface RappelDAbonnement {
  readonly email: string;
  readonly locale: SupportedLocale;
  readonly jetonDeDesabonnement: string;
}

export interface INewsletterMailer {
  envoyerLaConfirmation(confirmation: ConfirmationAEnvoyer): Promise<void>;
  envoyerDejaAbonne(rappel: RappelDAbonnement): Promise<void>;
}
