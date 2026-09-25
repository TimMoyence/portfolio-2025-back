/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { User } from '../domain/User';
import { AuthenticateUserUseCase } from './AuthenticateUser.useCase';
import type { LoginCommand } from './dto/Login.command';
import type { PasswordService } from './services/PasswordService';
import {
  attendreSessionOuverte,
  buildUser,
  createMockPasswordService,
  createMockSessionDependances,
} from '../../../../test/factories/user.factory';

const WRONG_CREDENTIAL = 'bad-password';
const LEGACY_PBKDF2_HASH = 'legacy-pbkdf2-hash';
const REHASHED_ARGON2 = '$argon2id$new-hash';
const CURRENT_ARGON2 = '$argon2id$already-good';

describe('AuthenticateUserUseCase', () => {
  let { repo, refreshTokensRepo, jwtTokenService } =
    createMockSessionDependances();
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: AuthenticateUserUseCase;

  const attendreConnexionRefuseeSansVerification = async (user: User) => {
    repo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: user.email, password: 'password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    ({ repo, refreshTokensRepo, jwtTokenService } =
      createMockSessionDependances());
    passwordService = createMockPasswordService();
    passwordService.verify.mockResolvedValue(true);

    useCase = new AuthenticateUserUseCase(
      repo,
      refreshTokensRepo,
      passwordService,
      jwtTokenService,
    );
  });

  it('returns a token when credentials are valid', async () => {
    const user = buildUser({
      email: 'john@example.com',
      passwordHash: 'hashed',
    });
    repo.findByEmail.mockResolvedValue(user);

    const dto: LoginCommand = {
      email: 'john@example.com',
      password: 'password',
    };

    const result = await useCase.execute(dto);

    expect(passwordService.verify).toHaveBeenCalledWith(
      dto.password,
      user.passwordHash,
    );
    attendreSessionOuverte(result, user, {
      signer: jwtTokenService.sign,
      creerRefreshToken: refreshTokensRepo.create,
    });
  });

  it('throws when credentials are invalid', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws when the user is inactive', async () => {
    await attendreConnexionRefuseeSansVerification(
      buildUser({
        id: 'user-2',
        email: 'inactive@example.com',
        passwordHash: 'hashed',
        firstName: 'Ina',
        lastName: 'Ctive',
        isActive: false,
      }),
    );
  });

  it('throws when user has no password hash (Google-only account)', async () => {
    await attendreConnexionRefuseeSansVerification(
      buildUser({
        id: 'user-google',
        email: 'google@example.com',
        passwordHash: null,
        firstName: 'Google',
        lastName: 'User',
        googleId: 'google-123',
      }),
    );
  });

  it('throws when the password does not match', async () => {
    const user = buildUser({
      id: 'user-3',
      email: 'johnny@example.com',
      passwordHash: 'hashed',
      firstName: 'John',
      lastName: 'Smith',
    });
    repo.findByEmail.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'johnny@example.com',
        password: WRONG_CREDENTIAL,
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordService.verify).toHaveBeenCalledWith(
      WRONG_CREDENTIAL,
      user.passwordHash,
    );
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });

  describe('rehash transparent', () => {
    it('re-hache le mot de passe si needsRehash retourne true', async () => {
      const user = buildUser({
        email: 'legacy@example.com',
        passwordHash: LEGACY_PBKDF2_HASH,
      });
      repo.findByEmail.mockResolvedValue(user);
      passwordService.needsRehash.mockReturnValue(true);
      passwordService.hash.mockResolvedValue(REHASHED_ARGON2);
      repo.update.mockResolvedValue(user);

      await useCase.execute({
        email: 'legacy@example.com',
        password: 'password',
      });

      expect(passwordService.needsRehash).toHaveBeenCalledWith(
        'legacy-pbkdf2-hash',
      );
      expect(passwordService.hash).toHaveBeenCalledWith('password');
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: REHASHED_ARGON2,
      });
    });

    it('ne re-hache pas si needsRehash retourne false', async () => {
      const user = buildUser({
        email: 'modern@example.com',
        passwordHash: CURRENT_ARGON2,
      });
      repo.findByEmail.mockResolvedValue(user);
      passwordService.needsRehash.mockReturnValue(false);

      await useCase.execute({
        email: 'modern@example.com',
        password: 'password',
      });

      expect(passwordService.needsRehash).toHaveBeenCalledWith(
        '$argon2id$already-good',
      );
      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});
