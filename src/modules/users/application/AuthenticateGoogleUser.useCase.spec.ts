/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { AuthenticateGoogleUserUseCase } from './AuthenticateGoogleUser.useCase';
import {
  attendreSessionOuverte,
  buildUser,
  createMockSessionDependances,
} from '../../../../test/factories/user.factory';
import { attendreMiseAJourDeLUtilisateur } from '../../../../test/helpers/utilisateurs';

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const GOOGLE_PAYLOAD = {
  sub: 'google-sub-123',
  email: 'john@gmail.com',
  email_verified: true,
  given_name: 'John',
  family_name: 'Doe',
};

describe('AuthenticateGoogleUserUseCase', () => {
  let { repo, refreshTokensRepo, jwtTokenService } =
    createMockSessionDependances();
  let useCase: AuthenticateGoogleUserUseCase;

  beforeEach(() => {
    ({ repo, refreshTokensRepo, jwtTokenService } =
      createMockSessionDependances());

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
    attendreSessionOuverte(result, user, {
      signer: jwtTokenService.sign,
      creerRefreshToken: refreshTokensRepo.create,
    });
  });

  it('lie le googleId et retourne AuthResult quand le user est trouve par email', async () => {
    const user = buildUser({ googleId: null });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(user);
    repo.update.mockResolvedValue({ ...user, googleId: 'google-sub-123' });

    const result = await useCase.execute('valid-id-token');

    expect(repo.findByEmail).toHaveBeenCalledWith('john@gmail.com');
    attendreMiseAJourDeLUtilisateur(repo.update, {
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

  describe('inscription d un compte Google', () => {
    const inscrireAvec = async (profil: Record<string, unknown>) => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ ...GOOGLE_PAYLOAD, ...profil }),
      });
      repo.findByGoogleId.mockResolvedValue(null);
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(buildUser({ id: 'new-user' }));
      await useCase.execute('valid-id-token');
      return repo.create.mock.calls[0][0];
    };

    it('reussit avec un nom vide quand Google n en donne pas', async () => {
      await expect(
        inscrireAvec({ family_name: undefined }),
      ).resolves.toMatchObject({ firstName: 'John', lastName: '' });
    });

    it('prend la partie locale de l adresse quand Google ne donne pas de prenom', async () => {
      for (const given_name of [undefined, '', '   ']) {
        repo.create.mockClear();
        await expect(inscrireAvec({ given_name })).resolves.toMatchObject({
          firstName: 'john',
          lastName: 'Doe',
        });
      }
    });

    it('coupe a 50 caracteres un prenom et un nom Google trop longs', async () => {
      await expect(
        inscrireAvec({
          given_name: ` ${'A'.repeat(60)}`,
          family_name: `${'B'.repeat(49)} C${'D'.repeat(10)}`,
        }),
      ).resolves.toMatchObject({
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(49),
      });
    });

    it('ne coupe pas un caractere en deux au plafond de 50', async () => {
      await expect(
        inscrireAvec({ given_name: `${'A'.repeat(49)}😀😀` }),
      ).resolves.toMatchObject({ firstName: 'A'.repeat(49) });
    });
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

  it('refuse de lier googleId quand byEmail.emailVerified est false (anti-takeover)', async () => {
    const unverifiedUser = buildUser({
      googleId: null,
      emailVerified: false,
    });
    repo.findByGoogleId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(unverifiedUser);

    await expect(useCase.execute('valid-id-token')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );

    expect(repo.update).not.toHaveBeenCalled();
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
    expect(refreshTokensRepo.create).not.toHaveBeenCalled();
  });
});
