import type { IUsersRepository } from '../../src/modules/users/domain/IUsers.repository';
import { User } from '../../src/modules/users/domain/User';
import type { PasswordService } from '../../src/modules/users/application/services/PasswordService';
import type { JwtTokenService } from '../../src/modules/users/application/services/JwtTokenService';
import type { AuthResult } from '../../src/modules/users/application/AuthenticateUser.useCase';
import type { JwtPayload } from '../../src/modules/users/application/services/JwtPayload';
import type { ListUsersUseCase } from '../../src/modules/users/application/ListUsers.useCase';
import type { ListOneUserUseCase } from '../../src/modules/users/application/ListOneUser.useCase';
import type { CreateUsersUseCase } from '../../src/modules/users/application/CreateUsers.useCase';
import type { UpdateUsersUseCase } from '../../src/modules/users/application/UpdateUsers.useCase';
import type { DeleteUsersUseCase } from '../../src/modules/users/application/DeleteUsers.useCase';

/** Construit un objet User domaine avec des valeurs par defaut. */
export function buildUser(overrides?: Partial<User>): User {
  const user = new User();
  user.id = 'user-1';
  user.email = 'test@example.com';
  user.passwordHash = 'salt:hash';
  user.firstName = 'Jean';
  user.lastName = 'Dupont';
  user.phone = null;
  user.isActive = true;
  user.roles = [];
  user.googleId = null;
  user.emailVerified = true;
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

/** Typage des mocks de use cases du module Users (CRUD admin). */
export interface MockUsersUseCases {
  listUsers: jest.Mocked<Pick<ListUsersUseCase, 'execute'>>;
  listOneUser: jest.Mocked<Pick<ListOneUserUseCase, 'execute'>>;
  createUsers: jest.Mocked<Pick<CreateUsersUseCase, 'execute'>>;
  updateUsers: jest.Mocked<Pick<UpdateUsersUseCase, 'execute'>>;
  deleteUsers: jest.Mocked<Pick<DeleteUsersUseCase, 'execute'>>;
}

/** Cree des mocks types pour tous les use cases du UsersController. */
export function createMockUsersUseCases(): MockUsersUseCases {
  return {
    listUsers: { execute: jest.fn() },
    listOneUser: { execute: jest.fn() },
    createUsers: { execute: jest.fn() },
    updateUsers: { execute: jest.fn() },
    deleteUsers: { execute: jest.fn() },
  };
}
