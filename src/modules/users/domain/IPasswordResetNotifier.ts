export interface PasswordResetNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

/** Port de notification pour les emails de reinitialisation de mot de passe. */
export interface IPasswordResetNotifier {
  sendPasswordResetEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void>;
}
