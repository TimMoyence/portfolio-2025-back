import type { RefreshToken } from './RefreshToken';

export interface IRefreshTokensRepository {
  create(token: RefreshToken): Promise<RefreshToken>;

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  revokeByUserId(userId: string): Promise<void>;

  revokeById(id: string): Promise<void>;

  rotateById(id: string, graceUntil: Date): Promise<boolean>;

  purgeExpired(): Promise<number>;
}
