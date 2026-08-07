import type { PasswordResetToken } from './PasswordResetToken';

export interface IPasswordResetTokensRepository {
  create(token: PasswordResetToken): Promise<PasswordResetToken>;

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  invalidateActiveByUserId(userId: string): Promise<void>;

  markUsed(id: string): Promise<void>;
}
