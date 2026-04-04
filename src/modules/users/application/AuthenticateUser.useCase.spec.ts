/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { AuthenticateUserUseCase } from './AuthenticateUser.useCase';
import type { LoginCommand } from './dto/Login.command';
import type { JwtTokenService } from './services/JwtTokenService';
import type { PasswordService } from './services/PasswordService';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
  createMockJwtService,
} from '../../../../test/factories/user.factory';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';

describe('AuthenticateUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: AuthenticateUserUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    refreshTokensRepo = createMockRefreshTokensRepo();
    passwordService = createMockPasswordService();
    passwordService.verify.mockResolvedValue(true);
    jwtTokenService = createMockJwtService();
    jwtTokenService.sign.mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 900,
      expiresAt: 0,
    });
    refreshTokensRepo.create.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hashed',
      expiresAt: new Date(),
      revoked: false,
    });

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
    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: [],
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.expiresIn).toBe(900);
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toBe(user);
    expect(refreshTokensRepo.create).toHaveBeenCalled();
  });

  it('throws when credentials are invalid', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws when the user is inactive', async () => {
    const inactiveUser = buildUser({
      id: 'user-2',
      email: 'inactive@example.com',
      passwordHash: 'hashed',
      firstName: 'Ina',
      lastName: 'Ctive',
      isActive: false,
    });

    repo.findByEmail.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ email: 'inactive@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });

  it('throws when user has no password hash (Google-only account)', async () => {
    const googleUser = buildUser({
      id: 'user-google',
      email: 'google@example.com',
      passwordHash: null,
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-123',
    });
    repo.findByEmail.mockResolvedValue(googleUser);

    await expect(
      useCase.execute({ email: 'google@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
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
        password: 'bad-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwordService.verify).toHaveBeenCalledWith(
      'bad-password',
      user.passwordHash,
    );
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });

  describe('rehash transparent', () => {
    it('re-hache le mot de passe si needsRehash retourne true', async () => {
      const user = buildUser({
        email: 'legacy@example.com',
        passwordHash: 'legacy-pbkdf2-hash',
      });
      repo.findByEmail.mockResolvedValue(user);
      passwordService.needsRehash.mockReturnValue(true);
      passwordService.hash.mockResolvedValue('$argon2id$new-hash');
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
        passwordHash: '$argon2id$new-hash',
      });
    });

    it('ne re-hache pas si needsRehash retourne false', async () => {
      const user = buildUser({
        email: 'modern@example.com',
        passwordHash: '$argon2id$already-good',
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
