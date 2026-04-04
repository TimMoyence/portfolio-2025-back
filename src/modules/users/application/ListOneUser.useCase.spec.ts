/* eslint-disable @typescript-eslint/unbound-method */
import { ListOneUserUseCase } from './ListOneUser.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('ListOneUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: ListOneUserUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new ListOneUserUseCase(repo);
  });

  it('devrait retourner l utilisateur identifie par son id', async () => {
    const user = buildUser({ id: 'user-1' });
    repo.findById.mockResolvedValue(user);

    await expect(useCase.execute('user-1')).resolves.toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('user-1');
  });

  it('devrait retourner null si l utilisateur n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('inexistant')).resolves.toBeNull();
    expect(repo.findById).toHaveBeenCalledWith('inexistant');
  });
});
