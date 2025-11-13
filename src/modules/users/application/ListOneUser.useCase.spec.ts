import { ListOneUserUseCase } from './ListOneUser.useCase';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';

describe('ListOneUserUseCase', () => {
  it('returns the user identified by id', async () => {
    const repo: jest.Mocked<IUsersRepository> = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    const useCase = new ListOneUserUseCase(repo);

    const user = { id: 'user-1' } as Users;
    repo.findById.mockResolvedValue(user);

    await expect(useCase.execute('user-1')).resolves.toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('user-1');
  });
});
