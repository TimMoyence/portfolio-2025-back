import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';

export interface SubscribeNewsletterCommand {
  email: string;
  firstName?: string;
  locale: SupportedLocale;
  sourceFormationSlug: string;
  termsVersion: string;
  termsAcceptedAt: Date;
}
