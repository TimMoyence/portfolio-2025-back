import { createHash } from 'crypto';
import { HacheLesJetonsDeVerification1791624795249 } from '../src/migrations/1791624795249-HacheLesJetonsDeVerification';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const JETON_EN_CLAIR = 'f'.repeat(64);

describeDb('Hachage des jetons de verification sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [],
    [migrationsAnterieuresA('1791624795249-HacheLesJetonsDeVerification')],
  );

  it('remplace chaque jeton en clair par son empreinte sha256', async () => {
    const userId = await inscrireUtilisateur(base(), 'jeton@example.com');
    await base().query(
      `INSERT INTO "email_verification_tokens" ("user_id", "token", "expires_at")
       VALUES ($1, $2, now() + interval '1 day')`,
      [userId, JETON_EN_CLAIR],
    );

    await base().transaction((manager) =>
      new HacheLesJetonsDeVerification1791624795249().up(manager.queryRunner!),
    );

    const lignes: { token_hash: string }[] = await base().query(
      `SELECT "token_hash" FROM "email_verification_tokens"`,
    );
    expect(lignes).toEqual([
      {
        token_hash: createHash('sha256').update(JETON_EN_CLAIR).digest('hex'),
      },
    ]);
  });
});
