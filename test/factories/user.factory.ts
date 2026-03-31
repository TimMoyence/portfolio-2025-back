import type { IUsersRepository } from '../../src/modules/users/domain/IUsers.repository';
import { Users } from '../../src/modules/users/domain/Users';

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
