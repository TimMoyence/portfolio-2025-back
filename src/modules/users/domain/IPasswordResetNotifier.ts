export interface PasswordResetNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface IPasswordResetNotifier {
  sendPasswordResetEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void>;
}
