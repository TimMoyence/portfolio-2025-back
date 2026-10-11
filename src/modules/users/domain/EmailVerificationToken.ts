export interface EmailVerificationToken {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
}
