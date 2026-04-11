/** Payload pour l'envoi d'un email de verification. */
export interface EmailVerificationNotificationPayload {
  email: string;
  firstName: string;
  lastName: string;
  verificationUrl: string;
  expiresInMinutes: number;
}

/** Port de notification pour les emails de verification d'adresse email. */
export interface IEmailVerificationNotifier {
  sendVerificationEmail(
    payload: EmailVerificationNotificationPayload,
  ): Promise<void>;
}
