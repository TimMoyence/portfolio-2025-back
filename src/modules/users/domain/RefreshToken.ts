export interface RefreshToken {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  rotationGraceUntil?: Date | null;
  createdAt?: Date;
}
