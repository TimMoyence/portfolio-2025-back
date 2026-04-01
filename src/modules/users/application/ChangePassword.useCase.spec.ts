/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { Users } from '../domain/Users';
import { ChangePasswordUseCase } from './ChangePassword.useCase';
import type { ChangePasswordCommand } from './dto/ChangePassword.command';
import type { PasswordService } from './services/PasswordService';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
} from '../../../../test/factories/user.factory';

describe('ChangePasswordUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    passwordService = createMockPasswordService();
    passwordService.hash.mockReturnValue('new-hash');
    passwordService.verify.mockReturnValue(true);

    useCase = new ChangePasswordUseCase(repo, passwordService);
  });

  it('changes the password when current password matches', async () => {
    const user = buildUser({
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
      updatedOrCreatedBy: 'system',
    });
    repo.findById.mockResolvedValue(user);

    const updatedUser = { ...user, passwordHash: 'new-hash' } as Users;
    repo.update.mockResolvedValue(updatedUser);

    const dto: ChangePasswordCommand = {
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
    const user = buildUser({
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
    });
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
    const inactiveUser = buildUser({
      id: 'user-2',
      email: 'inactive@example.com',
      passwordHash: 'hash',
      firstName: 'Ina',
      lastName: 'Ctive',
      isActive: false,
      updatedOrCreatedBy: 'system',
    });

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
