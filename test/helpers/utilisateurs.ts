import { InvalidCredentialsError } from '../../src/common/domain/errors/InvalidCredentialsError';
import { UserNotFoundError } from '../../src/common/domain/errors/UserNotFoundError';
import type { IRefreshTokensRepository } from '../../src/modules/users/domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../../src/modules/users/domain/IUsers.repository';
import type { User } from '../../src/modules/users/domain/User';
import type { PasswordService } from '../../src/modules/users/application/services/PasswordService';
import { buildUser } from '../factories/user.factory';

export async function attendreUtilisateurIntrouvable(
  usersRepository: jest.Mocked<IUsersRepository>,
  executer: () => Promise<unknown>,
  effetEvite: unknown,
): Promise<void> {
  usersRepository.findById.mockResolvedValue(null);
  await expect(executer()).rejects.toBeInstanceOf(UserNotFoundError);
  expect(effetEvite).not.toHaveBeenCalled();
}

export function attendreMiseAJourDeLUtilisateur(
  update: IUsersRepository['update'],
  champs: Record<string, unknown>,
): void {
  expect(update).toHaveBeenCalledWith(
    'user-1',
    expect.objectContaining({ ...champs, updatedAt: expect.any(Date) }),
  );
}

export function preparerNouveauMotDePasse(
  usersRepository: jest.Mocked<IUsersRepository>,
  passwordService: jest.Mocked<PasswordService>,
  existant: Partial<User>,
): User {
  usersRepository.findById.mockResolvedValue(
    buildUser({ id: 'user-1', ...existant }),
  );
  passwordService.hash.mockResolvedValue('new-hash');
  const updatedUser = buildUser({ id: 'user-1', passwordHash: 'new-hash' });
  usersRepository.update.mockResolvedValue(updatedUser);
  return updatedUser;
}

export function attendreNouveauMotDePasseEnregistre(
  effets: {
    hacher: PasswordService['hash'];
    mettreAJour: IUsersRepository['update'];
  },
  motDePasse: string,
  auteur: string,
): void {
  expect(effets.hacher).toHaveBeenCalledWith(motDePasse);
  expect(effets.mettreAJour).toHaveBeenCalledWith(
    'user-1',
    expect.objectContaining({
      passwordHash: 'new-hash',
      updatedOrCreatedBy: auteur,
    }),
  );
}

export function itRefuseUnRefreshTokenInconnu(
  banc: () => {
    refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
    useCase: { execute(token: string): Promise<unknown> };
  },
): void {
  it('lance InvalidCredentialsError quand le token est inexistant', async () => {
    const { refreshTokensRepo, useCase } = banc();
    refreshTokensRepo.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute('unknown-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });
}
