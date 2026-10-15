import type { EmailVerificationToken } from './EmailVerificationToken';

export interface IEmailVerificationTokensRepository {
  create(token: EmailVerificationToken): Promise<EmailVerificationToken>;

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;

  invalidateActiveByUserId(userId: string): Promise<void>;

  deleteByUserId(userId: string): Promise<void>;

  countRecentByUserId(userId: string, sinceMs: number): Promise<number>;
}
