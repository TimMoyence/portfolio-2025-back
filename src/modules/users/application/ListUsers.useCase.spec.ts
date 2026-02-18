/* eslint-disable @typescript-eslint/unbound-method */
import { ListUsersUseCase } from './ListUsers.useCase';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';

describe('ListUsersUseCase', () => {
  it('returns all users from the repository', async () => {
    const repo: jest.Mocked<IUsersRepository> = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    const useCase = new ListUsersUseCase(repo);

    const users = [{ id: '1' } as Users, { id: '2' } as Users];
    repo.findAll.mockResolvedValue(users);

    await expect(useCase.execute()).resolves.toBe(users);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});
