import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { EnvoiDeVerificationEmail } from '../src/modules/users/application/services/email-verification-dispatch';
import { EnvoiDeReinitialisation } from '../src/modules/users/application/services/password-reset-dispatch';
import { CompteDejaInscritError } from '../src/modules/users/domain/CompteDejaInscritError';
import { EmailVerificationTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/EmailVerificationTokens.repository.typeORM';
import { EmailVerificationTokenEntity } from '../src/modules/users/infrastructure/entities/EmailVerificationToken.entity';
import { PasswordResetTokenEntity } from '../src/modules/users/infrastructure/entities/PasswordResetToken.entity';
import { UsersEntity } from '../src/modules/users/infrastructure/entities/Users.entity';
import { PasswordResetTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/PasswordResetTokens.repository.typeORM';
import { UsersRepositoryTypeORM } from '../src/modules/users/infrastructure/Users.repository.typeORM';
import { buildConfigService } from './factories/env.factory';
import {
  createMockEmailVerificationNotifier,
  createMockPasswordResetNotifier,
} from './factories/mailer.factory';
import {
  createMockPasswordService,
  createMockSessionDependances,
} from './factories/user.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: () =>
      Promise.resolve({
        getPayload: () => ({
          sub: 'google-simultane',
          email: 'simultane@gmail.com',
          email_verified: true,
          given_name: 'Sim',
        }),
      }),
  })),
}));

const SAISIE_DU_CANDIDAT = 'MotDePasse123!';

describeDb('Depot des comptes sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );
  let userId: string;

  beforeAll(async () => {
    userId = await inscrireUtilisateur(base(), 'casse@example.com');
  });

  it.each([
    ['casse@example.com'],
    ['Casse@Example.COM'],
    ['CASSE@EXAMPLE.COM'],
  ])('retrouve le compte inscrit par l adresse saisie %p', async (saisie) => {
    const depot = new UsersRepositoryTypeORM(base().getRepository(UsersEntity));

    await expect(depot.findByEmail(saisie)).resolves.toMatchObject({
      id: userId,
      email: 'casse@example.com',
    });
  });

  it.each([['autre@example.com'], ['pas une adresse']])(
    'ne retrouve aucun compte pour %p',
    async (saisie) => {
      const depot = new UsersRepositoryTypeORM(
        base().getRepository(UsersEntity),
      );

      await expect(depot.findByEmail(saisie)).resolves.toBeNull();
    },
  );

  describe('adresse ou compte Google deja pris', () => {
    const depot = () =>
      new UsersRepositoryTypeORM(base().getRepository(UsersEntity));

    it('refuse un second compte a la meme adresse par un conflit de compte deja inscrit', async () => {
      await expect(
        depot().create({
          email: 'casse@example.com',
          firstName: 'Second',
          lastName: 'Compte',
        }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
    });

    it('refuse de donner a un compte l adresse d un autre par un conflit de compte deja inscrit', async () => {
      const second = await inscrireUtilisateur(base(), 'second@example.com');

      await expect(
        depot().update(second, { email: 'casse@example.com' }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
      await expect(depot().findById(second)).resolves.toMatchObject({
        email: 'second@example.com',
      });
    });

    it('refuse de lier a un compte le compte Google d un autre par un conflit de compte deja inscrit', async () => {
      const lie = await inscrireUtilisateur(base(), 'lie@example.com');
      const intrus = await inscrireUtilisateur(base(), 'intrus@example.com');
      await depot().update(lie, { googleId: 'google-pris' });

      await expect(
        depot().update(intrus, { googleId: 'google-pris' }),
      ).rejects.toBeInstanceOf(CompteDejaInscritError);
    });
  });

  describe('une adresse deja inscrite qui s inscrit de nouveau', () => {
    it('recoit la meme reponse, et son titulaire un seul lien de reinitialisation', async () => {
      const comptes = new UsersRepositoryTypeORM(
        base().getRepository(UsersEntity),
      );
      const verification = createMockEmailVerificationNotifier();
      const reinitialisation = createMockPasswordResetNotifier();
      const motsDePasse = createMockPasswordService();
      motsDePasse.hash.mockResolvedValue('hash-derive');
      const inscription = new CreateUsersUseCase(
        comptes,
        new EnvoiDeVerificationEmail(
          new EmailVerificationTokensRepositoryTypeORM(
            base().getRepository(EmailVerificationTokenEntity),
          ),
          verification,
          buildConfigService(),
        ),
        motsDePasse,
        new EnvoiDeReinitialisation(
          new PasswordResetTokensRepositoryTypeORM(
            base().getRepository(PasswordResetTokenEntity),
          ),
          reinitialisation,
          buildConfigService(),
        ),
      );
      const candidat = {
        email: 'doublon@example.com',
        password: SAISIE_DU_CANDIDAT,
        firstName: 'Lea',
        lastName: 'Martin',
      };

      const premiere = await inscription.inscrire(candidat);
      const seconde = await inscription.inscrire({
        ...candidat,
        email: 'Doublon@Example.COM',
      });

      expect(seconde).toEqual(premiere);
      expect(verification.sendVerificationEmail.mock.calls).toHaveLength(1);
      expect(reinitialisation.sendRegistrationAttemptEmail.mock.calls).toEqual([
        [expect.objectContaining({ email: 'doublon@example.com' })],
      ]);
      const titulaire = await comptes.findByEmail(candidat.email);
      await expect(
        base()
          .getRepository(PasswordResetTokenEntity)
          .countBy({ userId: titulaire?.id }),
      ).resolves.toBe(1);
    });
  });

  it('ouvre deux premieres connexions Google simultanees sur un seul compte', async () => {
    const { refreshTokensRepo, jwtTokenService } =
      createMockSessionDependances();
    const connexion = new AuthenticateGoogleUserUseCase(
      new UsersRepositoryTypeORM(base().getRepository(UsersEntity)),
      refreshTokensRepo,
      jwtTokenService,
      'client-id',
    );

    const sessions = await Promise.all([
      connexion.execute('jeton-google'),
      connexion.execute('jeton-google'),
    ]);

    const comptes = await base()
      .getRepository(UsersEntity)
      .findBy({ googleId: 'google-simultane' });
    expect(comptes).toHaveLength(1);
    expect(sessions.map(({ user }) => user.id)).toEqual([
      comptes[0].id,
      comptes[0].id,
    ]);
  });
});
