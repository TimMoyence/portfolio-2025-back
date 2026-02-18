/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';
import { CreateUsersUseCase } from './CreateUsers.useCase';
import { CreateUserDto } from './dto/CreateUser.dto';
import { PasswordService } from './services/PasswordService';

describe('CreateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: CreateUsersUseCase;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    passwordService = {
      hash: jest.fn().mockReturnValue('hashed-password'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;
    useCase = new CreateUsersUseCase(repo, passwordService);
  });

  it('maps the DTO and persists the user', async () => {
    const dto: CreateUserDto = {
      email: 'john@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const savedUser: Users = {
      id: 'uuid',
      email: dto.email,
      passwordHash: 'hashed-password',
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: 'self-registration',
    };
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
