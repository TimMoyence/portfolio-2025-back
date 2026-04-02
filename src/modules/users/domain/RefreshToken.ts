/** Entite domaine representant un jeton de rafraichissement (refresh token). */
export interface RefreshToken {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt?: Date;
}
