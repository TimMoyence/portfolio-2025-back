import type { EmailVerificationToken } from './EmailVerificationToken';
import type { PlafondDEnvois } from './PlafondDEnvois';

export interface IEmailVerificationTokensRepository {
  remplacerLesJetonsActifs(
    jeton: Pick<EmailVerificationToken, 'userId' | 'tokenHash' | 'expiresAt'>,
    plafond: PlafondDEnvois,
  ): Promise<EmailVerificationToken | null>;

  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;

  deleteByUserId(userId: string): Promise<void>;
}
