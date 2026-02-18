/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';
import { ChangePasswordUseCase } from './ChangePassword.useCase';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { PasswordService } from './services/PasswordService';

describe('ChangePasswordUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: ChangePasswordUseCase;

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
      hash: jest.fn().mockReturnValue('new-hash'),
      verify: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<PasswordService>;

    useCase = new ChangePasswordUseCase(repo, passwordService);
  });

  it('changes the password when current password matches', async () => {
    const user: Users = {
      id: 'user-1',
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: 'system',
    };
    repo.findById.mockResolvedValue(user);

    const updatedUser = { ...user, passwordHash: 'new-hash' } as Users;
    repo.update.mockResolvedValue(updatedUser);

    const dto: ChangePasswordDto = {
      userId: 'user-1',
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
    };

    const result = await useCase.execute(dto);

    expect(passwordService.verify).toHaveBeenCalledWith(
      dto.currentPassword,
      user.passwordHash,
    );
    expect(passwordService.hash).toHaveBeenCalledWith(dto.newPassword);
    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordHash: 'new-hash',
        updatedOrCreatedBy: user.updatedOrCreatedBy,
        updatedAt: expect.any(Date),
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('throws when user is not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing',
        currentPassword: 'old',
        newPassword: 'new',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when current password is invalid', async () => {
    const user = {
      id: 'user-1',
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: null,
    } as Users;
    repo.findById.mockResolvedValue(user);
    passwordService.verify.mockReturnValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        currentPassword: 'wrong',
        newPassword: 'new',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects inactive users even if the password matches', async () => {
    const inactiveUser = {
      id: 'user-2',
      email: 'inactive@example.com',
      passwordHash: 'hash',
      firstName: 'Ina',
      lastName: 'Ctive',
      phone: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: 'system',
    } as Users;

    repo.findById.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({
        userId: 'user-2',
        currentPassword: 'whatever',
        newPassword: 'new-pass',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });
});
