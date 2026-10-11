import { EmailVerificationTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/EmailVerificationTokens.repository.typeORM';
import { EmailVerificationTokenEntity } from '../src/modules/users/infrastructure/entities/EmailVerificationToken.entity';
import { PasswordResetTokenEntity } from '../src/modules/users/infrastructure/entities/PasswordResetToken.entity';
import { PasswordResetTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/PasswordResetTokens.repository.typeORM';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

const UNE_HEURE_MS = 60 * 60 * 1000;

describeDb('Depots de jetons sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );
  let userId: string;

  const dans = (ms: number) => new Date(Date.now() + ms);
  const empreinte = (rang: number) => rang.toString(16).padStart(64, '0');

  beforeAll(async () => {
    userId = await inscrireUtilisateur(base(), 'depots@example.com');
  });

  it('retrouve un jeton de verification par son empreinte tant qu il n a pas expire', async () => {
    const depot = new EmailVerificationTokensRepositoryTypeORM(
      base().getRepository(EmailVerificationTokenEntity),
    );

    const cree = await depot.create({
      userId,
      tokenHash: empreinte(1),
      expiresAt: dans(UNE_HEURE_MS),
    });
    await depot.create({
      userId,
      tokenHash: empreinte(2),
      expiresAt: dans(-UNE_HEURE_MS),
    });

    expect(cree).toMatchObject({ userId, tokenHash: empreinte(1) });
    expect(cree.id).toEqual(expect.any(String));
    await expect(depot.findActiveByTokenHash(empreinte(1))).resolves.toEqual(
      cree,
    );
    await expect(depot.findActiveByTokenHash(empreinte(2))).resolves.toBeNull();
  });

  it('ecarte un jeton de reinitialisation deja utilise ou expire', async () => {
    const depot = new PasswordResetTokensRepositoryTypeORM(
      base().getRepository(PasswordResetTokenEntity),
    );

    const actif = await depot.create({
      userId,
      tokenHash: empreinte(3),
      expiresAt: dans(UNE_HEURE_MS),
      usedAt: null,
    });
    await depot.create({
      userId,
      tokenHash: empreinte(4),
      expiresAt: dans(UNE_HEURE_MS),
      usedAt: new Date(),
    });
    await depot.create({
      userId,
      tokenHash: empreinte(5),
      expiresAt: dans(-UNE_HEURE_MS),
      usedAt: null,
    });

    await expect(depot.findActiveByTokenHash(empreinte(3))).resolves.toEqual(
      actif,
    );
    await expect(depot.findActiveByTokenHash(empreinte(4))).resolves.toBeNull();
    await expect(depot.findActiveByTokenHash(empreinte(5))).resolves.toBeNull();
  });
});
