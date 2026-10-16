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
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';
import {
  attendreMiseAJourDeLUtilisateur,
  attendreNouveauMotDePasseEnregistre,
  attendreUtilisateurIntrouvable,
} from '../../../../test/helpers/utilisateurs';

const CHOSEN_CREDENTIAL = 'NewPassword123!';

describe('UpdateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let refreshTokensRepo: ReturnType<typeof createMockRefreshTokensRepo>;
  let useCase: UpdateUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    passwordService = createMockPasswordService();
    passwordService.hash.mockResolvedValue('new-hash');
    refreshTokensRepo = createMockRefreshTokensRepo();
    useCase = new UpdateUsersUseCase(repo, passwordService, refreshTokensRepo);
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
    expect(refreshTokensRepo.revokeByUserId).not.toHaveBeenCalled();
  });

  it('ferme toutes les sessions du compte quand l admin change son mot de passe', async () => {
    repo.findById.mockResolvedValue(buildUser({ id: 'user-1' }));
    repo.update.mockResolvedValue(buildUser({ id: 'user-1' }));

    await useCase.execute('user-1', {
      firstName: 'Johnny',
      password: CHOSEN_CREDENTIAL,
      updatedOrCreatedBy: 'admin',
    });

    attendreMiseAJourDeLUtilisateur(repo.update, {
      firstName: 'Johnny',
      updatedOrCreatedBy: 'admin',
    });
    attendreNouveauMotDePasseEnregistre(
      { passwordService, usersRepository: repo, refreshTokensRepo },
      CHOSEN_CREDENTIAL,
      'admin',
    );
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
