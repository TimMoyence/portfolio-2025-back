/* eslint-disable @typescript-eslint/unbound-method */
import { ListUsersUseCase } from './ListUsers.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('ListUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new ListUsersUseCase(repo);
  });

  it('devrait retourner tous les utilisateurs depuis le repository', async () => {
    const users = [buildUser({ id: '1' }), buildUser({ id: '2' })];
    repo.findAll.mockResolvedValue(users);

    await expect(useCase.execute()).resolves.toBe(users);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner une liste vide si aucun utilisateur', async () => {
    repo.findAll.mockResolvedValue([]);

    await expect(useCase.execute()).resolves.toEqual([]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});
