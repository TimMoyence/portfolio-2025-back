/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { UpdateUserCommand } from './dto/UpdateUser.command';
import type { PasswordService } from './services/PasswordService';
import { UpdateUsersUseCase } from './UpdateUsers.useCase';
import {
  createMockUsersRepo,
  createMockPasswordService,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('UpdateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: UpdateUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    passwordService = createMockPasswordService();
    passwordService.hash.mockResolvedValue('new-hash');
    useCase = new UpdateUsersUseCase(repo, passwordService);
  });

  it('devrait mettre a jour l utilisateur quand il existe', async () => {
    const user = buildUser({ id: 'user-1', email: 'john@example.com' });
    repo.findById.mockResolvedValue(user);

    const dto: UpdateUserCommand = {
      firstName: 'Johnny',
      phone: '123456789',
    };

    const updatedUser = buildUser({
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'Johnny',
      phone: '123456789',
    });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', dto);

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        firstName: dto.firstName,
        phone: dto.phone,
        updatedAt: expect.any(Date),
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('devrait lever une exception quand l utilisateur n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing', {} as UpdateUserCommand),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
