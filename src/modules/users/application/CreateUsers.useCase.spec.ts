/* eslint-disable @typescript-eslint/unbound-method */
import type { IUsersRepository } from '../domain/IUsers.repository';
import { CreateUsersUseCase } from './CreateUsers.useCase';
import type { CreateUserCommand } from './dto/CreateUser.command';
import type { PasswordService } from './services/PasswordService';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
} from '../../../../test/factories/user.factory';

describe('CreateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: CreateUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    passwordService = createMockPasswordService();
    passwordService.hash.mockResolvedValue('hashed-password');
    useCase = new CreateUsersUseCase(repo, passwordService);
  });

  it('maps the DTO and persists the user', async () => {
    const dto: CreateUserCommand = {
      email: 'john@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const savedUser = buildUser({
      id: 'uuid',
      email: dto.email,
      passwordHash: 'hashed-password',
      firstName: dto.firstName,
      lastName: dto.lastName,
      updatedOrCreatedBy: 'self-registration',
    });
    repo.create.mockResolvedValue(savedUser);

    const result = await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        passwordHash: 'hashed-password',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: null,
        isActive: true,
        updatedOrCreatedBy: 'self-registration',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
    expect(passwordService.hash).toHaveBeenCalledWith(dto.password);
    expect(result).toBe(savedUser);
  });

  it('devrait forcer roles vides quand updatedOrCreatedBy est self-registration', async () => {
    const dto: CreateUserCommand = {
      email: 'attacker@example.com',
      password: 'Hack123!',
      firstName: 'Evil',
      lastName: 'User',
      roles: ['admin', 'budget'],
    };

    const savedUser = buildUser({ email: dto.email, roles: [] });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [] }),
    );
  });

  it('devrait conserver les roles quand cree par un admin', async () => {
    const dto: CreateUserCommand = {
      email: 'new@example.com',
      password: 'Secure123!',
      firstName: 'New',
      lastName: 'User',
      roles: ['budget', 'weather'],
      updatedOrCreatedBy: 'admin-user-id',
    };

    const savedUser = buildUser({
      email: dto.email,
      roles: ['budget', 'weather'],
    });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['budget', 'weather'] }),
    );
  });
});
