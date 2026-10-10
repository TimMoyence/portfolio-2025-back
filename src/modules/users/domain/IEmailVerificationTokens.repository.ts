import type { EmailVerificationToken } from './EmailVerificationToken';

export interface IEmailVerificationTokensRepository {
  create(token: EmailVerificationToken): Promise<EmailVerificationToken>;

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;

  deleteByUserId(userId: string): Promise<void>;

  countRecentByUserId(userId: string, sinceMs: number): Promise<number>;
}
