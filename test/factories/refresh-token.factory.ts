import type { IRefreshTokensRepository } from '../../src/modules/users/domain/IRefreshTokens.repository';
import type { RefreshToken } from '../../src/modules/users/domain/RefreshToken';

export function buildRefreshToken(
  overrides?: Partial<RefreshToken>,
): RefreshToken {
  return {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revoked: false,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createMockRefreshTokensRepo(): jest.Mocked<IRefreshTokensRepository> {
  return {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    revokeByUserId: jest.fn(),
    revokeById: jest.fn(),
    purgeExpired: jest.fn(),
  };
}
