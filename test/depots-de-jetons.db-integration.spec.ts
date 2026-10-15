import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  IsNull,
  MoreThan,
  type DeepPartial,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { EnvoiDeVerificationEmail } from '../src/modules/users/application/services/email-verification-dispatch';
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
import { createMockPasswordResetNotifier } from './factories/mailer.factory';
import { buildUser, createMockUsersRepo } from './factories/user.factory';

const UNE_HEURE_MS = 60 * 60 * 1000;
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

  beforeAll(async () => {
    userId = await inscrireUtilisateur(base(), 'depots@example.com');
  });

  it('retrouve un jeton de verification par son empreinte tant qu il n a pas expire', async () => {
    const depot = depotDeVerification();

    await depot.remplacerLesJetonsActifs({
      userId,
      tokenHash: empreinte(2),
      expiresAt: dans(-UNE_HEURE_MS),
    });
    const expiresAt = dans(UNE_HEURE_MS);
    const cree = await depot.remplacerLesJetonsActifs({
      userId,
      tokenHash: empreinte(1),
      expiresAt,
    });

    expect(cree).toMatchObject({ userId, tokenHash: empreinte(1), expiresAt });
    expect(cree.id).toEqual(expect.any(String));
    await expect(depot.findActiveByTokenHash(empreinte(1))).resolves.toEqual(
      cree,
    );
    await expect(depot.findActiveByTokenHash(empreinte(2))).resolves.toBeNull();
  });

  it('expire les jetons de verification actifs d un compte sans les retirer du compte des demandes recentes', async () => {
    const depot = depotDeVerification();
    const compte = await inscrireUtilisateur(base(), 'renvois@example.com');
    const remplacer = (rang: number) =>
      depot.remplacerLesJetonsActifs({
        userId: compte,
        tokenHash: empreinte(rang),
        expiresAt: dans(UNE_HEURE_MS),
      });
    await remplacer(7);
    const dernier = await remplacer(8);

    await expect(depot.findActiveByTokenHash(empreinte(7))).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(8))).resolves.toEqual(
      dernier,
    );
    await expect(depot.countRecentByUserId(compte, UNE_HEURE_MS)).resolves.toBe(
      2,
    );
  });

  it('ecarte un jeton de reinitialisation deja utilise ou expire', async () => {
    const depot = depotDeReinitialisation();

    const actif = await depot.remplacerLesJetonsActifs({
      userId,
      tokenHash: empreinte(3),
      expiresAt: dans(UNE_HEURE_MS),
    });
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

    expect(actif.usedAt).toBeNull();
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

  describe('deux emissions simultanees pour un meme compte', () => {
    const configParDefaut = {
      get: (_cle: string, parDefaut: string) => parDefaut,
    } as unknown as ConfigService;

    it('ne laissent qu un lien de reinitialisation actif', async () => {
      const compte = await inscrireUtilisateur(
        base(),
        'course-reinitialisation@example.com',
      );
      const comptes = createMockUsersRepo();
      comptes.findByEmail.mockResolvedValue(
        buildUser({ id: compte, passwordHash: 'hash' }),
      );
      const notifier = createMockPasswordResetNotifier();
      notifier.sendPasswordResetEmail.mockResolvedValue();
      const demande = new RequestPasswordResetUseCase(
        comptes,
        depotDeReinitialisation(),
        notifier,
        configParDefaut,
      );

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
        { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) },
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

    it('compte une demande de verification faite a l instant parmi les demandes recentes', async () => {
      const depot = depotDeVerification();
      const compte = await inscrireUtilisateur(
        base(),
        'fuseau-renvois@example.com',
      );
      await depot.remplacerLesJetonsActifs({
        userId: compte,
        tokenHash: empreinte(9),
        expiresAt: dans(UNE_HEURE_MS),
      });

      await expect(
        depot.countRecentByUserId(compte, UNE_HEURE_MS),
      ).resolves.toBe(1);
    });

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
});
