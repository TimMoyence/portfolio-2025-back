import type { EmailVerificationToken } from './EmailVerificationToken';

/** Port de persistance des jetons de verification d'email. */
export interface IEmailVerificationTokensRepository {
  /** Cree un nouveau jeton de verification en base. */
  create(token: EmailVerificationToken): Promise<EmailVerificationToken>;

  /** Charge un jeton actif (non expire) a partir de sa valeur. */
  findActiveByToken(token: string): Promise<EmailVerificationToken | null>;

  /** Supprime tous les jetons d'un utilisateur. */
  deleteByUserId(userId: string): Promise<void>;

  /** Compte les jetons crees pour un utilisateur dans les N derniers millisecondes. */
  countRecentByUserId(userId: string, sinceMs: number): Promise<number>;
}
