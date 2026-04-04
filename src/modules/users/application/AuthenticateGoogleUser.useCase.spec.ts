/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { AuthenticateGoogleUserUseCase } from './AuthenticateGoogleUser.useCase';
import type { JwtTokenService } from './services/JwtTokenService';
import {
  buildUser,
  createMockUsersRepo,
  createMockJwtService,
} from '../../../../test/factories/user.factory';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';

/**
 * Mock du module google-auth-library.
 * On intercepte le constructeur OAuth2Client et sa methode verifyIdToken.
 */
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

/** Payload Google simule pour les tests. */
const GOOGLE_PAYLOAD = {
  sub: 'google-sub-123',
  email: 'john@gmail.com',
  email_verified: true,
  given_name: 'John',
  family_name: 'Doe',
};

describe('AuthenticateGoogleUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let refreshTokensRepo: jest.Mocked<IRefreshTokensRepository>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: AuthenticateGoogleUserUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    refreshTokensRepo = createMockRefreshTokensRepo();
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

    mockVerifyIdToken.mockReset();
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => GOOGLE_PAYLOAD,
    });

    useCase = new AuthenticateGoogleUserUseCase(
      repo,
      refreshTokensRepo,
      jwtTokenService,
      'fake-client-id',
    );
  });

  it('retourne AuthResult quand le user est trouve par googleId', async () => {
    const user = buildUser();
    repo.findByGoogleId.mockResolvedValue(user);

    const result = await useCase.execute('valid-id-token');

    expect(repo.findByGoogleId).toHaveBeenCalledWith('google-sub-123');
    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.expiresIn).toBe(900);
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toBe(user);
    expect(refreshTokensRepo.create).toHaveBeenCalled();
  });

  it('lie le googleId et retourne AuthResult quand le user est trouve par email', async () => {
    const user = buildUser({ googleId: null });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(user);
    repo.update.mockResolvedValue({ ...user, googleId: 'google-sub-123' });

    const result = await useCase.execute('valid-id-token');

    expect(repo.findByEmail).toHaveBeenCalledWith('john@gmail.com');
    expect(repo.update).toHaveBeenCalledWith('user-1', {
      googleId: 'google-sub-123',
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBeDefined();
  });

  it('cree un nouveau compte quand aucun user existant', async () => {
    const created = buildUser({ id: 'new-user' });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(created);

    const result = await useCase.execute('valid-id-token');

    expect(repo.create).toHaveBeenCalled();
    expect(result.user).toBe(created);
    expect(result.refreshToken).toBeDefined();
  });

  it('lance InvalidCredentialsError quand le token Google est invalide', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await expect(useCase.execute('bad-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it("lance InvalidCredentialsError quand le email Google n'est pas verifie", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...GOOGLE_PAYLOAD, email_verified: false }),
    });

    await expect(useCase.execute('unverified-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('lance InvalidCredentialsError quand le user trouve par googleId est inactif', async () => {
    const inactiveUser = buildUser({ isActive: false });
    repo.findByGoogleId.mockResolvedValue(inactiveUser);

    await expect(useCase.execute('valid-id-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });
});
