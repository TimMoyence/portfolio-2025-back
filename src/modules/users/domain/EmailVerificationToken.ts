/** Entite domaine representant un jeton de verification d'adresse email. */
export interface EmailVerificationToken {
  id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}
