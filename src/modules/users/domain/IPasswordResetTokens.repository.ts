import type { PasswordResetToken } from './PasswordResetToken';

export interface IPasswordResetTokensRepository {
  remplacerLesJetonsActifs(
    jeton: Pick<PasswordResetToken, 'userId' | 'tokenHash' | 'expiresAt'>,
  ): Promise<PasswordResetToken>;

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  markUsed(id: string): Promise<boolean>;
}
