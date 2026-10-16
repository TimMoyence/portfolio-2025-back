/* eslint-disable @typescript-eslint/unbound-method */
import { buildConfigService } from '../../../../test/factories/env.factory';
import {
  createMockEmailVerificationNotifier,
  createMockPasswordResetNotifier,
} from '../../../../test/factories/mailer.factory';
import {
  buildPasswordResetToken,
  createMockPasswordResetTokensRepo,
} from '../../../../test/factories/password-reset-token.factory';
import {
  rendueAuPlancher,
  simulerLHorlogeAChaqueTest,
} from '../../../../test/helpers/plancher-de-latence';
import { CompteDejaInscritError } from '../domain/CompteDejaInscritError';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TROIS_ENVOIS_PAR_HEURE } from '../domain/PlafondDEnvois';
import type { User } from '../domain/User';
import { CreateUsersUseCase } from './CreateUsers.useCase';
import type {
  CreateUserCommand,
  InscriptionCommand,
} from './dto/CreateUser.command';
import type { PasswordService } from './services/PasswordService';
import { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';
import { EnvoiDeReinitialisation } from './services/password-reset-dispatch';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
} from '../../../../test/factories/user.factory';
import {
  buildEmailVerificationToken,
  createMockEmailVerificationTokensRepo,
} from '../../../../test/factories/email-verification-token.factory';

const PLAIN_CREDENTIAL = 'SecurePassword123!';
const ATTACKER_CREDENTIAL = 'Hack123!';
const DERIVED_HASH = 'hashed-password';

describe('CreateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let emailVerificationTokensRepo: jest.Mocked<IEmailVerificationTokensRepository>;
  let emailVerificationNotifier: jest.Mocked<IEmailVerificationNotifier>;
  let passwordService: jest.Mocked<PasswordService>;
  let resetTokensRepo: ReturnType<typeof createMockPasswordResetTokensRepo>;
  let resetNotifier: ReturnType<typeof createMockPasswordResetNotifier>;
  let useCase: CreateUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    emailVerificationTokensRepo = createMockEmailVerificationTokensRepo();
    emailVerificationNotifier = createMockEmailVerificationNotifier();
    passwordService = createMockPasswordService();
    passwordService.hash.mockResolvedValue(DERIVED_HASH);
    emailVerificationTokensRepo.remplacerLesJetonsActifs.mockResolvedValue(
      buildEmailVerificationToken({ userId: 'uuid' }),
    );

    resetTokensRepo = createMockPasswordResetTokensRepo();
    resetTokensRepo.remplacerLesJetonsActifs.mockResolvedValue(
      buildPasswordResetToken(),
    );
    resetNotifier = createMockPasswordResetNotifier();

    useCase = new CreateUsersUseCase(
      repo,
      new EnvoiDeVerificationEmail(
        emailVerificationTokensRepo,
        emailVerificationNotifier,
        buildConfigService({
          EMAIL_VERIFICATION_URL_BASE: 'https://asilidesign.fr/verify-email',
        }),
      ),
      passwordService,
      new EnvoiDeReinitialisation(
        resetTokensRepo,
        resetNotifier,
        buildConfigService({
          PASSWORD_RESET_URL_BASE: 'https://asilidesign.fr/reset-password',
        }),
      ),
    );
  });

  const creerEtAttendreLesRoles = async (
    dto: CreateUserCommand,
    roles: User['roles'],
    persiste: Partial<User> = {},
  ) => {
    repo.create.mockResolvedValue(
      buildUser({ email: dto.email, roles, ...persiste }),
    );

    await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ roles }),
    );
  };

  it('maps the DTO and persists the user', async () => {
    const dto: CreateUserCommand = {
      email: 'john@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'John',
      lastName: 'Doe',
      updatedOrCreatedBy: 'self-registration',
    };

    const savedUser = buildUser({
      id: 'uuid',
      email: dto.email,
      passwordHash: DERIVED_HASH,
      firstName: dto.firstName,
      lastName: dto.lastName,
      updatedOrCreatedBy: 'self-registration',
    });
    repo.create.mockResolvedValue(savedUser);

    const result = await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        passwordHash: DERIVED_HASH,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: null,
        isActive: true,
        updatedOrCreatedBy: 'self-registration',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
    expect(passwordService.hash).toHaveBeenCalledWith(dto.password);
    expect(result.user).toBe(savedUser);
  });

  it('devrait envoyer un email de verification pour les inscriptions publiques', async () => {
    const dto: CreateUserCommand = {
      email: 'new@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'New',
      lastName: 'User',
      updatedOrCreatedBy: 'self-registration',
    };

    const savedUser = buildUser({
      id: 'uuid',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerified: false,
    });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(
      emailVerificationTokensRepo.remplacerLesJetonsActifs,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'uuid',
        tokenHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        expiresAt: expect.any(Date),
      }),
      TROIS_ENVOIS_PAR_HEURE,
    );
    expect(
      emailVerificationNotifier.sendVerificationEmail,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        firstName: 'New',
        lastName: 'User',
        verificationUrl: expect.stringContaining('token='),
        expiresInMinutes: 1440,
      }),
    );
  });

  it('devrait creer le compte actif et sans roles pour les inscriptions publiques (roles attribues apres verification)', async () => {
    const dto: CreateUserCommand = {
      email: 'attacker@example.com',
      password: ATTACKER_CREDENTIAL,
      firstName: 'Evil',
      lastName: 'User',
      roles: ['admin', 'teacher'],
      isActive: false,
      updatedOrCreatedBy: 'self-registration',
    };

    await creerEtAttendreLesRoles(dto, [], { emailVerified: false });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
  });

  it("devrait respecter les choix d'un admin qui omet l'auteur, sans courriel de verification", async () => {
    const dto: CreateUserCommand = {
      email: 'inactif@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'Compte',
      lastName: 'Inactif',
      roles: ['teacher'],
      isActive: false,
    };

    await creerEtAttendreLesRoles(dto, ['teacher']);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
    expect(
      emailVerificationNotifier.sendVerificationEmail,
    ).not.toHaveBeenCalled();
  });

  it('devrait conserver les roles quand cree par un admin', async () => {
    const dto: CreateUserCommand = {
      email: 'new@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'New',
      lastName: 'User',
      roles: ['admin', 'teacher'],
      updatedOrCreatedBy: 'admin-user-id',
    };

    await creerEtAttendreLesRoles(dto, ['admin', 'teacher']);
    expect(
      emailVerificationNotifier.sendVerificationEmail,
    ).not.toHaveBeenCalled();
  });

  describe('inscrire', () => {
    simulerLHorlogeAChaqueTest();

    const candidat = {
      email: 'lea@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'Lea',
      lastName: 'Martin',
    };
    const INSCRIPTION_ENREGISTREE = {
      message:
        'Inscription reussie. Un email de verification a ete envoye a votre adresse.',
    };
    const titulaire = buildUser({
      id: 'user-5',
      email: 'lea@example.com',
      passwordHash: 'hash',
    });
    const adresseDejaInscrite = (compte: User | null) => {
      repo.create.mockRejectedValue(new CompteDejaInscritError());
      repo.findByEmail.mockResolvedValue(compte);
    };

    it('enregistre un compte public actif et sans roles, quel que soit l auteur envoye', async () => {
      repo.create.mockResolvedValue(buildUser({ id: 'uuid', roles: [] }));
      const corpsForge: InscriptionCommand & { updatedOrCreatedBy: string } = {
        ...candidat,
        roles: ['admin'],
        isActive: false,
        updatedOrCreatedBy: 'admin-forge',
      };

      await expect(
        rendueAuPlancher(useCase.inscrire(corpsForge)),
      ).resolves.toEqual(INSCRIPTION_ENREGISTREE);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [],
          isActive: true,
          updatedOrCreatedBy: 'self-registration',
        }),
      );
      expect(
        emailVerificationNotifier.sendVerificationEmail,
      ).toHaveBeenCalledTimes(1);
    });

    it('repond a une adresse deja inscrite comme a une inscription neuve, au meme plancher', async () => {
      adresseDejaInscrite(titulaire);

      await expect(
        rendueAuPlancher(useCase.inscrire(candidat)),
      ).resolves.toEqual(INSCRIPTION_ENREGISTREE);
    });

    it('previent le titulaire de la tentative par un lien de reinitialisation', async () => {
      adresseDejaInscrite(titulaire);

      await rendueAuPlancher(useCase.inscrire(candidat));

      expect(repo.findByEmail).toHaveBeenCalledWith('lea@example.com');
      expect(resetNotifier.sendRegistrationAttemptEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'lea@example.com',
          resetUrl: expect.stringContaining('token=') as string,
        }),
      );
      expect(resetNotifier.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(
        emailVerificationNotifier.sendVerificationEmail,
      ).not.toHaveBeenCalled();
    });

    it('repond pareil sans ecrire au titulaire d un compte Google sans mot de passe', async () => {
      adresseDejaInscrite(
        buildUser({ id: 'user-5', passwordHash: null, googleId: 'g-5' }),
      );

      await expect(
        rendueAuPlancher(useCase.inscrire(candidat)),
      ).resolves.toEqual(INSCRIPTION_ENREGISTREE);

      expect(resetNotifier.sendRegistrationAttemptEmail).not.toHaveBeenCalled();
    });

    it('laisse passer une autre panne de la creation', async () => {
      repo.create.mockRejectedValue(new Error('base indisponible'));

      await expect(
        rendueAuPlancher(useCase.inscrire(candidat)),
      ).rejects.toThrow('base indisponible');
      expect(repo.findByEmail).not.toHaveBeenCalled();
    });
  });
});
