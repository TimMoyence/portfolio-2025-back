/* eslint-disable @typescript-eslint/unbound-method */
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import { DeleteUsersUseCase } from './DeleteUsers.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('DeleteUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: DeleteUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new DeleteUsersUseCase(repo);
  });

  it('devrait desactiver l utilisateur quand il existe', async () => {
    const user = buildUser({ id: 'user-1' });
    const deactivated = buildUser({ id: 'user-1', isActive: false });
    repo.findById.mockResolvedValue(user);
    repo.deactivate.mockResolvedValue(deactivated);

    const result = await useCase.execute('user-1');

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.deactivate).toHaveBeenCalledWith('user-1');
    expect(result).toBe(deactivated);
  });

  it('devrait lever une exception quand l utilisateur n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(repo.deactivate).not.toHaveBeenCalled();
  });
});
