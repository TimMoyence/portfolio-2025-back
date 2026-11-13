import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';

export interface EmailVerificationNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  verificationUrl: string;
  expiresInMinutes: number;
  locale: SupportedLocale;
}

export interface IEmailVerificationNotifier {
  sendVerificationEmail(
    payload: EmailVerificationNotificationPayload,
  ): Promise<void>;
}
