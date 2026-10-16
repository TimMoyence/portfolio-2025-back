import type { RefreshToken } from './RefreshToken';

export interface IRefreshTokensRepository {
  create(token: RefreshToken): Promise<RefreshToken>;

  createSuccessor(
    previousId: string,
    token: RefreshToken,
  ): Promise<RefreshToken | null>;

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  revokeByUserId(userId: string): Promise<void>;

  rotateById(id: string, graceUntil: Date): Promise<boolean>;

  purgeExpired(): Promise<number>;
}
