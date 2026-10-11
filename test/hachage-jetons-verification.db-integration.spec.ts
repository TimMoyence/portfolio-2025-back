import { createHash } from 'crypto';
import { HacheLesJetonsDeVerification1791624795249 } from '../src/migrations/1791624795249-HacheLesJetonsDeVerification';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const JETONS_EN_CLAIR = ['f'.repeat(64), 'a'.repeat(64)];

const empreinte = (jeton: string): string =>
  createHash('sha256').update(jeton).digest('hex');

describeDb('Hachage des jetons de verification sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [],
    [migrationsAnterieuresA('1791624795249-HacheLesJetonsDeVerification')],
  );
  const migration = new HacheLesJetonsDeVerification1791624795249();

  const jouer = (sens: 'up' | 'down') =>
    base().transaction((manager) => migration[sens](manager.queryRunner!));

  const enOrdre = (valeurs: string[]): string[] =>
    [...valeurs].sort((a, b) => a.localeCompare(b));

  const empreintesStockees = async (): Promise<string[]> => {
    const lignes: { token_hash: string }[] = await base().query(
      `SELECT "token_hash" FROM "email_verification_tokens"`,
    );
    return enOrdre(lignes.map(({ token_hash }) => token_hash));
  };

  const colonnesDesJetons = async (): Promise<string[]> => {
    const lignes: { column_name: string }[] = await base().query(
      `SELECT "column_name" FROM information_schema.columns
       WHERE "table_name" = 'email_verification_tokens'
       AND "column_name" IN ('token', 'token_hash')`,
    );
    return lignes.map(({ column_name }) => column_name);
  };

  const hacherEtVerifier = async (): Promise<void> => {
    await jouer('up');

    expect(await empreintesStockees()).toEqual(
      enOrdre(JETONS_EN_CLAIR.map(empreinte)),
    );
  };

  it('remplace chaque jeton en clair par son empreinte sha256', async () => {
    for (const [rang, jeton] of JETONS_EN_CLAIR.entries()) {
      const userId = await inscrireUtilisateur(
        base(),
        `jeton${rang}@example.com`,
      );
      await base().query(
        `INSERT INTO "email_verification_tokens" ("user_id", "token", "expires_at")
         VALUES ($1, $2, now() + interval '1 day')`,
        [userId, jeton],
      );
    }

    await hacherEtVerifier();
  });

  it('ne rehache rien sur une base dont la colonne porte deja les empreintes', async () => {
    await hacherEtVerifier();
  });

  it('retire au retour arriere les empreintes, inutilisables en clair, et rend la colonne token', async () => {
    await jouer('down');

    expect(await colonnesDesJetons()).toEqual(['token']);
    expect(
      await base().query(`SELECT 1 FROM "email_verification_tokens"`),
    ).toEqual([]);
  });
});
