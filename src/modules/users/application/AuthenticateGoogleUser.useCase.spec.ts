/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { Users } from '../domain/Users';
import { AuthenticateGoogleUserUseCase } from './AuthenticateGoogleUser.useCase';
import type { JwtTokenService } from './services/JwtTokenService';

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

/** Utilisateur domaine de reference pour les tests. */
function makeUser(overrides: Partial<Users> = {}): Users {
  return {
    id: 'user-1',
    email: 'john@gmail.com',
    passwordHash: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    isActive: true,
    roles: ['budget'],
    googleId: 'google-sub-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedOrCreatedBy: null,
    ...overrides,
  };
}

describe('AuthenticateGoogleUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: AuthenticateGoogleUserUseCase;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    jwtTokenService = {
      sign: jest
        .fn()
        .mockReturnValue({ token: 'jwt-token', expiresIn: 3600, expiresAt: 0 }),
    } as unknown as jest.Mocked<JwtTokenService>;

    mockVerifyIdToken.mockReset();
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => GOOGLE_PAYLOAD,
    });

    useCase = new AuthenticateGoogleUserUseCase(
      repo,
      jwtTokenService,
      'fake-client-id',
    );
  });

  it('retourne AuthResult quand le user est trouve par googleId', async () => {
    const user = makeUser();
    repo.findByGoogleId.mockResolvedValue(user);

    const result = await useCase.execute('valid-id-token');

    expect(repo.findByGoogleId).toHaveBeenCalledWith('google-sub-123');
    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    expect(result).toEqual({
      accessToken: 'jwt-token',
      expiresIn: 3600,
      user,
    });
  });

  it('lie le googleId et retourne AuthResult quand le user est trouve par email', async () => {
    const user = makeUser({ googleId: null });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(user);
    repo.update.mockResolvedValue({ ...user, googleId: 'google-sub-123' });

    const result = await useCase.execute('valid-id-token');

    expect(repo.findByEmail).toHaveBeenCalledWith('john@gmail.com');
    expect(repo.update).toHaveBeenCalledWith('user-1', {
      googleId: 'google-sub-123',
    });
    expect(result.accessToken).toBe('jwt-token');
  });

  it('cree un nouveau compte quand aucun user existant', async () => {
    const created = makeUser({ id: 'new-user' });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(created);

    const result = await useCase.execute('valid-id-token');

    expect(repo.create).toHaveBeenCalled();
    expect(result.user).toBe(created);
  });

  it('lance UnauthorizedException quand le token Google est invalide', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await expect(useCase.execute('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("lance UnauthorizedException quand le email Google n'est pas verifie", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...GOOGLE_PAYLOAD, email_verified: false }),
    });

    await expect(useCase.execute('unverified-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lance UnauthorizedException quand le user trouve par googleId est inactif', async () => {
    const inactiveUser = makeUser({ isActive: false });
    repo.findByGoogleId.mockResolvedValue(inactiveUser);

    await expect(useCase.execute('valid-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });
});
