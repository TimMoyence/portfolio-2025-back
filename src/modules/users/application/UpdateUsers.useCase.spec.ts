/* eslint-disable @typescript-eslint/unbound-method */
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { User } from '../domain/User';
import type { UpdateUserCommand } from './dto/UpdateUser.command';
import type { PasswordService } from './services/PasswordService';
import { UpdateUsersUseCase } from './UpdateUsers.useCase';
import {
  createMockUsersRepo,
  createMockPasswordService,
  buildUser,
} from '../../../../test/factories/user.factory';
import {
  attendreMiseAJourDeLUtilisateur,
  attendreUtilisateurIntrouvable,
} from '../../../../test/helpers/utilisateurs';

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

  const mettreAJour = async (
    existant: Partial<User>,
    dto: UpdateUserCommand,
  ) => {
    repo.findById.mockResolvedValue(buildUser({ id: 'user-1', ...existant }));
    const updatedUser = buildUser({ id: 'user-1', ...existant, ...dto });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', dto);

    attendreMiseAJourDeLUtilisateur(repo.update, { ...dto });
    return { result, updatedUser };
  };

  it('devrait mettre a jour l utilisateur quand il existe', async () => {
    const { result, updatedUser } = await mettreAJour(
      { email: 'john@example.com' },
      { firstName: 'Johnny', phone: '123456789' },
    );

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(result).toBe(updatedUser);
  });

  it('devrait mettre a jour les roles de l utilisateur', async () => {
    const { result } = await mettreAJour(
      { roles: [] },
      { roles: ['admin', 'teacher'] },
    );

    expect(result.roles).toEqual(['admin', 'teacher']);
  });

  it('devrait lever une exception quand l utilisateur n existe pas', async () => {
    await attendreUtilisateurIntrouvable(
      repo,
      () => useCase.execute('missing', {} as UpdateUserCommand),
      repo.update,
    );
  });
});
