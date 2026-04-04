import type { IUsersRepository } from '../../src/modules/users/domain/IUsers.repository';
import { Users } from '../../src/modules/users/domain/Users';
import type { PasswordService } from '../../src/modules/users/application/services/PasswordService';
import type { JwtTokenService } from '../../src/modules/users/application/services/JwtTokenService';
import type { AuthResult } from '../../src/modules/users/application/AuthenticateUser.useCase';
import type { JwtPayload } from '../../src/modules/users/application/services/JwtPayload';

/** Construit un objet Users domaine avec des valeurs par defaut. */
export function buildUser(overrides?: Partial<Users>): Users {
  const user = new Users();
  user.id = 'user-1';
  user.email = 'test@example.com';
  user.passwordHash = 'salt:hash';
  user.firstName = 'Jean';
  user.lastName = 'Dupont';
  user.phone = null;
  user.isActive = true;
  user.roles = [];
  user.googleId = null;
  user.createdAt = new Date('2026-01-01');
  user.updatedAt = new Date('2026-01-01');
  user.updatedOrCreatedBy = null;
  return Object.assign(user, overrides);
}

/** Cree un mock complet du repository utilisateurs. */
export function createMockUsersRepo(): jest.Mocked<IUsersRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByGoogleId: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };
}

/** Cree un mock du service de mot de passe (hash/verify sont async). */
export function createMockPasswordService(): jest.Mocked<PasswordService> {
  return {
    hash: jest.fn(),
    verify: jest.fn(),
    needsRehash: jest.fn(),
  } as unknown as jest.Mocked<PasswordService>;
}

/** Cree un mock du service JWT. */
export function createMockJwtService(): jest.Mocked<JwtTokenService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  } as unknown as jest.Mocked<JwtTokenService>;
}

/** Construit un payload JWT valide avec des valeurs par defaut. */
export function buildJwtPayload(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    roles: [],
    iat: 1704067200,
    exp: 1704070800,
    iss: 'portfolio-2025',
    aud: 'portfolio-2025-api',
    ...overrides,
  };
}

/** Construit un resultat d'authentification complet reutilisable. */
export function buildAuthResult(overrides?: Partial<AuthResult>): AuthResult {
  return {
    accessToken: 'jwt-token',
    expiresIn: 900,
    refreshToken: 'raw-refresh-token',
    user: buildUser(),
    ...overrides,
  };
}
