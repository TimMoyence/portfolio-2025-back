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
    passwordService.hash.mockReturnValue('hashed-password');
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
});
