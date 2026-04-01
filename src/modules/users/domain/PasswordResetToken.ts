/** Entite domaine representant un jeton de reinitialisation de mot de passe. */
export interface PasswordResetToken {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
