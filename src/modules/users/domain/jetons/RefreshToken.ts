export interface RefreshToken {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  rotationGraceUntil?: Date | null;
  createdAt?: Date;
}

export function estRevoqueHorsRotation(jeton: RefreshToken): boolean {
  return jeton.revoked && !jeton.rotationGraceUntil;
}
