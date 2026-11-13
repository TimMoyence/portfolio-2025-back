import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';

export interface PasswordResetNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  resetUrl: string;
  expiresInMinutes: number;
  locale: SupportedLocale;
}

export interface IPasswordResetNotifier {
  sendPasswordResetEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void>;
  sendRegistrationAttemptEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void>;
}
