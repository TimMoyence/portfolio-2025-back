/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { DeleteUsersUseCase } from './DeleteUsers.useCase';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';

describe('DeleteUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: DeleteUsersUseCase;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    useCase = new DeleteUsersUseCase(repo);
  });

  it('soft deletes a user when it exists', async () => {
    const user = { id: 'user-1' } as Users;
    const deactivated = { ...user, isActive: false } as Users;
    repo.findById.mockResolvedValue(user);
    repo.deactivate.mockResolvedValue(deactivated);

    const result = await useCase.execute('user-1');

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.deactivate).toHaveBeenCalledWith('user-1');
    expect(result).toBe(deactivated);
  });

  it('throws when the user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.deactivate).not.toHaveBeenCalled();
  });
});
