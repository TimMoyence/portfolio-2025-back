import { EffaceLesReferentsDesPagesAJeton1791909333000 } from '../src/migrations/1791909333000-EffaceLesReferentsDesPagesAJeton';
import {
  baseMigreeDeLaSuite,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';
import {
  REFERENTS_DES_PAGES_A_JETON,
  REFERENTS_SANS_JETON,
} from './helpers/referents-des-pages-a-jeton';

const INSERTIONS = {
  cookie_consents: `INSERT INTO "cookie_consents"
    ("requestId", "policyVersion", "locale", "region", "source", "action", "preferences", "referer")
    VALUES (uuid_generate_v4(), 'v1', 'fr', 'eu', 'banner', 'accept_all', '{}'::jsonb, $1)`,
  audit_requests: `INSERT INTO "audit_requests"
    ("requestId", "websiteName", "contactMethod", "contactValue", "referer")
    VALUES (uuid_generate_v4(), 'Site', 'email', 'contact@example.com', $1)`,
};

type TableDeProvenance = keyof typeof INSERTIONS;

const TABLES = Object.keys(INSERTIONS) as TableDeProvenance[];

describeDb(
  'Effacement des referents des pages a jeton sur une base migree',
  () => {
    const base = baseMigreeDeLaSuite(
      [],
      migrationsAnterieuresA('1791909333000-EffaceLesReferentsDesPagesAJeton'),
    );
    const migration = new EffaceLesReferentsDesPagesAJeton1791909333000();

    const referentsDe = async (table: TableDeProvenance) => {
      const lignes: { referer: string | null }[] = await base().query(
        `SELECT "referer" FROM "${table}"`,
      );
      const referents = lignes.map(({ referer }) => referer);
      return {
        table,
        effaces: referents.filter((referent) => referent === null).length,
        gardes: new Set(referents.filter((referent) => referent !== null)),
      };
    };

    const attendreLesReferentsAJetonEffaces = async (): Promise<void> => {
      for (const table of TABLES) {
        expect(await referentsDe(table)).toEqual({
          table,
          effaces: REFERENTS_DES_PAGES_A_JETON.length,
          gardes: new Set(REFERENTS_SANS_JETON),
        });
      }
    };

    it('efface le referent de chaque page a jeton et garde les autres, dans chaque table de provenance', async () => {
      for (const table of TABLES) {
        for (const referent of [
          ...REFERENTS_DES_PAGES_A_JETON,
          ...REFERENTS_SANS_JETON,
        ]) {
          await base().query(INSERTIONS[table], [referent]);
        }
      }

      await jouerLaMigration(base(), migration, 'up');

      await attendreLesReferentsAJetonEffaces();
    });

    it('ne rend au retour arriere aucun jeton efface', async () => {
      await jouerLaMigration(base(), migration, 'down');

      await attendreLesReferentsAJetonEffaces();
    });
  },
);
