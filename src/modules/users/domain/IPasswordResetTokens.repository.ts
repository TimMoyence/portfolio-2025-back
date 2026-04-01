import type { PasswordResetToken } from './PasswordResetToken';

/** Port de persistance des jetons de reinitialisation de mot de passe. */
export interface IPasswordResetTokensRepository {
  /** Cree un nouveau jeton en base. */
  create(token: PasswordResetToken): Promise<PasswordResetToken>;

  /** Charge un jeton actif (non utilise, non expire) a partir de son hash. */
  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /** Invalide tous les jetons actifs d'un utilisateur. */
  invalidateActiveByUserId(userId: string): Promise<void>;

  /** Marque un jeton comme utilise. */
  markUsed(id: string): Promise<void>;
}
