import { Logger } from '@nestjs/common';
import {
  IsNull,
  MoreThan,
  type DeepPartial,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';
import { InvalidCredentialsError } from '../src/common/domain/errors/InvalidCredentialsError';
import { TokenReuseDetectedError } from '../src/common/domain/errors/TokenReuseDetectedError';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResendVerificationEmailUseCase } from '../src/modules/users/application/ResendVerificationEmail.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { EnvoiDeVerificationEmail } from '../src/modules/users/application/services/email-verification-dispatch';
import { EnvoiDeReinitialisation } from '../src/modules/users/application/services/password-reset-dispatch';
import { TROIS_ENVOIS_PAR_HEURE } from '../src/modules/users/domain/PlafondDEnvois';
import { emettreJeton, TokenHash } from '../src/common/domain/crypto/TokenHash';
import { EmailVerificationTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/EmailVerificationTokens.repository.typeORM';
import { EmailVerificationTokenEntity } from '../src/modules/users/infrastructure/entities/EmailVerificationToken.entity';
import { PasswordResetTokenEntity } from '../src/modules/users/infrastructure/entities/PasswordResetToken.entity';
import { RefreshTokenEntity } from '../src/modules/users/infrastructure/entities/RefreshToken.entity';
import { PasswordResetTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/PasswordResetTokens.repository.typeORM';
import { RefreshTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/RefreshTokens.repository.typeORM';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';
import { installerVariables } from './helpers/environnement';
import { buildConfigService } from './factories/env.factory';
import {
  createMockEmailVerificationNotifier,
  createMockPasswordResetNotifier,
} from './factories/mailer.factory';
import {
  buildSignedToken,
  buildUser,
  createMockJwtService,
  createMockPasswordService,
  createMockUsersRepo,
} from './factories/user.factory';

const UNE_MINUTE_MS = 60 * 1000;
const UNE_HEURE_MS = 60 * UNE_MINUTE_MS;
const UN_JOUR_MS = 24 * UNE_HEURE_MS;

describeDb('Depots de jetons sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );
  let userId: string;

  const dans = (ms: number) => new Date(Date.now() + ms);
  const empreinte = (rang: number) => rang.toString(16).padStart(64, '0');
  const semer = <E extends ObjectLiteral>(
    entite: EntityTarget<E>,
    champs: DeepPartial<E>,
  ): Promise<E> => {
    const depot = base().getRepository(entite);
    return depot.save(depot.create(champs));
  };
  const depotDeVerification = () =>
    new EmailVerificationTokensRepositoryTypeORM(
      base().getRepository(EmailVerificationTokenEntity),
    );
  const depotDeReinitialisation = () =>
    new PasswordResetTokensRepositoryTypeORM(
      base().getRepository(PasswordResetTokenEntity),
    );
  const remplacerSousLePlafond =
    (
      depot: ReturnType<
        typeof depotDeVerification | typeof depotDeReinitialisation
      >,
      compte: string,
    ) =>
    (rang: number) =>
      depot.remplacerLesJetonsActifs(
        {
          userId: compte,
          tokenHash: empreinte(rang),
          expiresAt: dans(UNE_HEURE_MS),
        },
        TROIS_ENVOIS_PAR_HEURE,
      );
  const liensDuCompte = (
    entite: EntityTarget<{ userId: string }>,
    compte: string,
  ) => base().getRepository(entite).countBy({ userId: compte });

  beforeAll(async () => {
    userId = await inscrireUtilisateur(base(), 'depots@example.com');
  });

  it('retrouve un jeton de verification par son empreinte tant qu il n a pas expire', async () => {
    const depot = depotDeVerification();

    await depot.remplacerLesJetonsActifs(
      {
        userId,
        tokenHash: empreinte(2),
        expiresAt: dans(-UNE_HEURE_MS),
      },
      TROIS_ENVOIS_PAR_HEURE,
    );
    const expiresAt = dans(UNE_HEURE_MS);
    const cree = await depot.remplacerLesJetonsActifs(
      {
        userId,
        tokenHash: empreinte(1),
        expiresAt,
      },
      TROIS_ENVOIS_PAR_HEURE,
    );

    expect(cree).toMatchObject({ userId, tokenHash: empreinte(1), expiresAt });
    expect(cree?.id).toEqual(expect.any(String));
    await expect(depot.findActiveByTokenHash(empreinte(1))).resolves.toEqual(
      cree,
    );
    await expect(depot.findActiveByTokenHash(empreinte(2))).resolves.toBeNull();
  });

  it('expire les jetons de verification actifs d un compte en les comptant dans le plafond horaire', async () => {
    const depot = depotDeVerification();
    const compte = await inscrireUtilisateur(base(), 'renvois@example.com');
    const remplacer = remplacerSousLePlafond(depot, compte);
    await remplacer(7);
    await remplacer(8);
    const dernier = await remplacer(12);

    await expect(remplacer(13)).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(7))).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(8))).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(12))).resolves.toEqual(
      dernier,
    );
    await expect(
      depot.findActiveByTokenHash(empreinte(13)),
    ).resolves.toBeNull();
  });

  it('compte les liens de reinitialisation utilises ou invalides dans le plafond du compte', async () => {
    const depot = depotDeReinitialisation();
    const compte = await inscrireUtilisateur(base(), 'oublis@example.com');
    const remplacer = remplacerSousLePlafond(depot, compte);
    const premier = await remplacer(21);
    await remplacer(22);
    const dernier = await remplacer(23);
    await depot.markUsed(dernier?.id ?? '');

    await expect(remplacer(24)).resolves.toBeNull();
    expect(premier).not.toBeNull();
    await expect(
      depot.findActiveByTokenHash(empreinte(24)),
    ).resolves.toBeNull();
    await expect(liensDuCompte(PasswordResetTokenEntity, compte)).resolves.toBe(
      3,
    );
  });

  it('ecarte un jeton de reinitialisation deja utilise ou expire', async () => {
    const depot = depotDeReinitialisation();

    const actif = await depot.remplacerLesJetonsActifs(
      {
        userId,
        tokenHash: empreinte(3),
        expiresAt: dans(UNE_HEURE_MS),
      },
      TROIS_ENVOIS_PAR_HEURE,
    );
    await semer(PasswordResetTokenEntity, {
      userId,
      tokenHash: empreinte(4),
      expiresAt: dans(UNE_HEURE_MS),
      usedAt: new Date(),
    });
    await semer(PasswordResetTokenEntity, {
      userId,
      tokenHash: empreinte(5),
      expiresAt: dans(-UNE_HEURE_MS),
      usedAt: null,
    });

    expect(actif?.usedAt).toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(3))).resolves.toEqual(
      actif,
    );
    await expect(depot.findActiveByTokenHash(empreinte(4))).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(5))).resolves.toBeNull();
  });

  it('ne consomme un jeton de reinitialisation qu une fois sous deux usages simultanes', async () => {
    const depot = depotDeReinitialisation();
    const { id } = await semer(PasswordResetTokenEntity, {
      userId,
      tokenHash: empreinte(6),
      expiresAt: dans(UNE_HEURE_MS),
      usedAt: null,
    });

    const usages = await Promise.all([depot.markUsed(id), depot.markUsed(id)]);

    expect([...usages].sort((a, b) => Number(a) - Number(b))).toEqual([
      false,
      true,
    ]);
    await expect(depot.findActiveByTokenHash(empreinte(6))).resolves.toBeNull();
  });

  const configParDefaut = buildConfigService();

  const demandeDeReinitialisation = (
    comptes: ReturnType<typeof createMockUsersRepo>,
  ) => {
    const notifier = createMockPasswordResetNotifier();
    const demande = new RequestPasswordResetUseCase(
      comptes,
      new EnvoiDeReinitialisation(
        depotDeReinitialisation(),
        notifier,
        configParDefaut,
      ),
    );
    return { demande, notifier };
  };

  describe('cinq demandes simultanees pour un meme compte', () => {
    const cinqFois = <T>(demande: () => Promise<T>) =>
      Promise.all([1, 2, 3, 4, 5].map(demande));
    const monterLeCompte = async (email: string) => {
      const compte = await inscrireUtilisateur(base(), email);
      const comptes = createMockUsersRepo();
      comptes.findByEmail.mockResolvedValue(
        buildUser({
          id: compte,
          email,
          passwordHash: 'hash',
          emailVerified: false,
        }),
      );
      return { compte, comptes };
    };

    it('cinq renvois simultanes n emettent que trois liens de verification dans l heure', async () => {
      const email = 'plafond-verification@example.com';
      const { compte, comptes } = await monterLeCompte(email);
      const notifier = createMockEmailVerificationNotifier();
      const renvoi = new ResendVerificationEmailUseCase(
        comptes,
        new EnvoiDeVerificationEmail(
          depotDeVerification(),
          notifier,
          configParDefaut,
        ),
      );

      const reponses = await cinqFois(() => renvoi.execute(email));

      expect(new Set(reponses.map(({ message }) => message)).size).toBe(1);
      expect(notifier.sendVerificationEmail.mock.calls).toHaveLength(3);
      await expect(
        liensDuCompte(EmailVerificationTokenEntity, compte),
      ).resolves.toBe(3);
    });

    it('cinq demandes simultanees n emettent que trois liens de reinitialisation dans l heure', async () => {
      const email = 'plafond-reinitialisation@example.com';
      const { compte, comptes } = await monterLeCompte(email);
      const { demande, notifier } = demandeDeReinitialisation(comptes);

      const reponses = await cinqFois(() => demande.execute({ email }));

      expect(new Set(reponses.map(({ message }) => message)).size).toBe(1);
      expect(notifier.sendPasswordResetEmail.mock.calls).toHaveLength(3);
      await expect(
        liensDuCompte(PasswordResetTokenEntity, compte),
      ).resolves.toBe(3);
    });
  });

  describe('deux emissions simultanees pour un meme compte', () => {
    it('ne laissent qu un lien de reinitialisation actif', async () => {
      const compte = await inscrireUtilisateur(
        base(),
        'course-reinitialisation@example.com',
      );
      const comptes = createMockUsersRepo();
      comptes.findByEmail.mockResolvedValue(
        buildUser({ id: compte, passwordHash: 'hash' }),
      );
      const { demande } = demandeDeReinitialisation(comptes);

      await Promise.all(
        [1, 2].map(() =>
          demande.execute({ email: 'course-reinitialisation@example.com' }),
        ),
      );

      await expect(
        base()
          .getRepository(PasswordResetTokenEntity)
          .countBy({
            userId: compte,
            usedAt: IsNull(),
            expiresAt: MoreThan(new Date()),
          }),
      ).resolves.toBe(1);
    });

    it('ne laissent qu un lien de verification actif', async () => {
      const compte = await inscrireUtilisateur(
        base(),
        'course-verification@example.com',
      );
      const envoi = new EnvoiDeVerificationEmail(
        depotDeVerification(),
        createMockEmailVerificationNotifier(),
        configParDefaut,
      );
      const destinataire = buildUser({ id: compte });

      await Promise.all(
        [1, 2].map(() =>
          envoi.envoyer(destinataire, compte, new Logger('course'), 'Echec'),
        ),
      );

      await expect(
        base()
          .getRepository(EmailVerificationTokenEntity)
          .countBy({ userId: compte, expiresAt: MoreThan(new Date()) }),
      ).resolves.toBe(1);
    });
  });

  describe('quel que soit le fuseau horaire du processus', () => {
    installerVariables({ TZ: 'Pacific/Kiritimati' });

    it('compte les demandes de verification faites a l instant dans le plafond horaire', async () => {
      const depot = depotDeVerification();
      const compte = await inscrireUtilisateur(
        base(),
        'fuseau-renvois@example.com',
      );
      const remplacer = remplacerSousLePlafond(depot, compte);
      await remplacer(9);
      await remplacer(14);
      await remplacer(15);

      await expect(remplacer(16)).resolves.toBeNull();
    });

    it.each([
      ['de verification', 'email_verification_tokens', depotDeVerification, 40],
      [
        'de reinitialisation',
        'password_reset_tokens',
        depotDeReinitialisation,
        50,
      ],
    ] as const)(
      'rend au compte ses trois liens %s une heure apres leur emission, pas avant',
      async (_canal, table, depot, rang) => {
        const compte = await inscrireUtilisateur(
          base(),
          `fenetre-${rang}@example.com`,
        );
        const remplacer = remplacerSousLePlafond(depot(), compte);
        const vieillirDe = (ancienneteMs: number) =>
          base().query(
            `UPDATE "${table}" SET "created_at" = LOCALTIMESTAMP - make_interval(secs => $1) WHERE "user_id" = $2`,
            [ancienneteMs / 1000, compte],
          );
        await remplacer(rang);
        await remplacer(rang + 1);
        await remplacer(rang + 2);

        await vieillirDe(UNE_HEURE_MS - UNE_MINUTE_MS);
        const avantLHeure = await remplacer(rang + 3);
        await vieillirDe(UNE_HEURE_MS + UNE_MINUTE_MS);
        const apresLHeure = await remplacer(rang + 4);

        expect([avantLHeure, apresLHeure?.tokenHash]).toEqual([
          null,
          empreinte(rang + 4),
        ]);
      },
    );

    it('ne purge un refresh token revoque qu au bout de sept jours', async () => {
      const compte = await inscrireUtilisateur(
        base(),
        'fuseau-purge@example.com',
      );
      const revoqueDepuis = async (rang: number, ancienneteMs: number) => {
        const { id } = await semer(RefreshTokenEntity, {
          userId: compte,
          tokenHash: empreinte(rang),
          expiresAt: dans(30 * UN_JOUR_MS),
          revoked: true,
        });
        await base().query(
          `UPDATE "refresh_tokens" SET "created_at" = LOCALTIMESTAMP - make_interval(secs => $1) WHERE "id" = $2`,
          [ancienneteMs / 1000, id],
        );
        return id;
      };
      const recent = await revoqueDepuis(10, 7 * UN_JOUR_MS - UNE_HEURE_MS);
      await revoqueDepuis(11, 7 * UN_JOUR_MS + UNE_HEURE_MS);

      await new RefreshTokensRepositoryTypeORM(
        base().getRepository(RefreshTokenEntity),
      ).purgeExpired();

      const restants = await base()
        .getRepository(RefreshTokenEntity)
        .findBy({ userId: compte });
      expect(restants.map(({ id }) => id)).toEqual([recent]);
    });
  });

  describe('un appareil reste ouvert pendant la revocation de toutes les sessions', () => {
    const MOT_DE_PASSE = 'NouveauMotDePasse1!';
    const ANCIEN_MOT_DE_PASSE = 'AncienMotDePasse1!';

    const monter = async (email: string) => {
      const utilisateur = buildUser({
        id: await inscrireUtilisateur(base(), email),
        email,
        passwordHash: 'hash',
      });
      const comptes = createMockUsersRepo();
      comptes.findByEmail.mockResolvedValue(utilisateur);
      comptes.findById.mockResolvedValue(utilisateur);
      comptes.update.mockResolvedValue(utilisateur);
      const motsDePasse = createMockPasswordService();
      motsDePasse.verify.mockResolvedValue(true);
      motsDePasse.hash.mockResolvedValue('nouveau-hash');
      motsDePasse.needsRehash.mockReturnValue(false);
      const jwt = createMockJwtService();
      jwt.sign.mockResolvedValue(buildSignedToken());
      const sessions = new RefreshTokensRepositoryTypeORM(
        base().getRepository(RefreshTokenEntity),
      );
      const connexion = new AuthenticateUserUseCase(
        comptes,
        motsDePasse,
        sessions,
        jwt,
      );
      return {
        utilisateur,
        comptes,
        motsDePasse,
        sessions,
        rafraichir: new RefreshTokensUseCase(sessions, comptes, jwt),
        seConnecter: async () =>
          (await connexion.execute({ email, password: MOT_DE_PASSE }))
            .refreshToken,
      };
    };
    type Banc = Awaited<ReturnType<typeof monter>>;

    const revocations: [
      string,
      (banc: Banc, appareil: string) => Promise<unknown>,
    ][] = [
      [
        'un changement de mot de passe',
        ({ utilisateur, comptes, motsDePasse, sessions }) =>
          new ChangePasswordUseCase(comptes, motsDePasse, sessions).execute({
            userId: utilisateur.id as string,
            currentPassword: ANCIEN_MOT_DE_PASSE,
            newPassword: MOT_DE_PASSE,
          }),
      ],
      [
        'une reinitialisation de mot de passe',
        async ({ utilisateur, comptes, motsDePasse, sessions }) => {
          const lien = emettreJeton();
          await depotDeReinitialisation().remplacerLesJetonsActifs(
            {
              userId: utilisateur.id as string,
              tokenHash: lien.empreinte,
              expiresAt: dans(UNE_HEURE_MS),
            },
            TROIS_ENVOIS_PAR_HEURE,
          );
          return new ResetPasswordUseCase(
            comptes,
            motsDePasse,
            sessions,
            depotDeReinitialisation(),
          ).execute({ token: lien.brut, newPassword: MOT_DE_PASSE });
        },
      ],
      [
        'une deconnexion',
        ({ sessions }, appareil) =>
          new RevokeTokenUseCase(sessions).execute(appareil),
      ],
    ];

    it.each(revocations)(
      'apres %s, l appareil reste ouvert ne ferme pas la session rouverte, qu il rafraichisse ou se deconnecte',
      async (evenement, revoquer) => {
        const banc = await monter(
          `sessions-${evenement.replaceAll(' ', '-')}@example.com`,
        );
        const portable = await banc.seConnecter();
        const telephone = await banc.seConnecter();

        await revoquer(banc, portable);
        const portableRouvert = await banc.seConnecter();

        await expect(banc.rafraichir.execute(telephone)).rejects.toBeInstanceOf(
          InvalidCredentialsError,
        );
        await new RevokeTokenUseCase(banc.sessions).execute(telephone);
        await expect(
          banc.rafraichir.execute(portableRouvert),
        ).resolves.toMatchObject({ user: banc.utilisateur });
      },
    );

    it('ferme toutes les sessions quand un jeton remplace par rotation est rejoue apres le delai de grace', async () => {
      const banc = await monter('sessions-rejeu@example.com');
      const vole = await banc.seConnecter();
      const autre = await banc.seConnecter();
      await banc.rafraichir.execute(vole);
      await base()
        .getRepository(RefreshTokenEntity)
        .update(
          { tokenHash: TokenHash.fromRaw(vole).value },
          { rotationGraceUntil: dans(-UNE_HEURE_MS) },
        );

      await expect(banc.rafraichir.execute(vole)).rejects.toBeInstanceOf(
        TokenReuseDetectedError,
      );
      await expect(banc.rafraichir.execute(autre)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });
  });
});
