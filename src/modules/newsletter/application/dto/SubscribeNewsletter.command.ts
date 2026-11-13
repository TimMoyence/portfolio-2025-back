import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';

export interface SubscribeNewsletterCommand {
  readonly email: string;
  readonly locale: SupportedLocale;
  readonly termsVersion: string;
  readonly termsAcceptedAt: Date;
}
