import type { PasswordResetToken } from './PasswordResetToken';
import type { PlafondDEnvois } from './PlafondDEnvois';

export interface IPasswordResetTokensRepository {
  remplacerLesJetonsActifs(
    jeton: Pick<PasswordResetToken, 'userId' | 'tokenHash' | 'expiresAt'>,
    plafond: PlafondDEnvois,
  ): Promise<PasswordResetToken | null>;

  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  markUsed(id: string): Promise<boolean>;
}
