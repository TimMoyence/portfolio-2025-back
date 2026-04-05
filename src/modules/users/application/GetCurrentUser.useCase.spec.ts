/* eslint-disable @typescript-eslint/unbound-method */
import { GetCurrentUserUseCase } from './GetCurrentUser.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('GetCurrentUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: GetCurrentUserUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new GetCurrentUserUseCase(repo);
  });

  it('devrait retourner l utilisateur correspondant au userId', async () => {
    const user = buildUser({ id: 'user-1' });
    repo.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1');

    expect(result).toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('user-1');
  });

  it('devrait lever une ResourceNotFoundError si l utilisateur n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('inexistant')).rejects.toThrow(
      ResourceNotFoundError,
    );
    expect(repo.findById).toHaveBeenCalledWith('inexistant');
  });
});
