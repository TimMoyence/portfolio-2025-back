export interface EmailVerificationToken {
  id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}
