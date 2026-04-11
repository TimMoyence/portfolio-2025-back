import type { IEmailVerificationTokensRepository } from '../../src/modules/users/domain/IEmailVerificationTokens.repository';
import type { EmailVerificationToken } from '../../src/modules/users/domain/EmailVerificationToken';

/** Construit un objet EmailVerificationToken domaine avec des valeurs par defaut. */
export function buildEmailVerificationToken(
  overrides?: Partial<EmailVerificationToken>,
): EmailVerificationToken {
  return {
    id: 'evt-1',
    userId: 'user-1',
    token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

/** Cree un mock complet du repository des tokens de verification email. */
export function createMockEmailVerificationTokensRepo(): jest.Mocked<IEmailVerificationTokensRepository> {
  return {
    create: jest.fn(),
    findActiveByToken: jest.fn(),
    deleteByUserId: jest.fn(),
    countRecentByUserId: jest.fn(),
  };
}
