import type { IPasswordResetTokensRepository } from '../../src/modules/users/domain/IPasswordResetTokens.repository';
import type { PasswordResetToken } from '../../src/modules/users/domain/PasswordResetToken';

export function buildPasswordResetToken(
  overrides?: Partial<PasswordResetToken>,
): PasswordResetToken {
  return {
    id: 'reset-token-1',
    userId: 'user-1',
    tokenHash:
      '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockPasswordResetTokensRepo(): jest.Mocked<IPasswordResetTokensRepository> {
  return {
    create: jest.fn(),
    findActiveByTokenHash: jest.fn(),
    invalidateActiveByUserId: jest.fn(),
    markUsed: jest.fn(),
  };
}
