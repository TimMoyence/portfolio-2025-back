export interface EmailVerificationNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface IEmailVerificationNotifier {
  sendVerificationEmail(
    payload: EmailVerificationNotificationPayload,
  ): Promise<void>;
}
