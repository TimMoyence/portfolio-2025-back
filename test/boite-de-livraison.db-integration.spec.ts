import { randomUUID } from 'crypto';
import { boiteDeLivraison } from '../src/common/domain/value-objects/boite-de-livraison';
import { BoiteDeLivraison1792136477037 } from '../src/migrations/1792136477037-BoiteDeLivraison';
import { ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255 } from './factories/verrou-par-boite.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const ADRESSES = [
  'lea@exemple.fr',
  'Lea.Martin@Exemple.FR',
  'lea+newsletter@exemple.fr',
  'lea+a+b@exemple.fr',
  'l.ea.m@gmail.com',
  'L.Ea+promo@GMAIL.com',
  'lea@googlemail.com',
  'l.ea+1@googlemail.com',
  '+lea@exemple.fr',
  'l.ea@sous.gmail.com',
  '"lea"@exemple.fr',
  '"L.ea+relance"@gmail.com',
  'lea@ｇｍａｉｌ.com',
  'Lea@EXÄMPLE.fr',
  ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255,
];
const TELEPHONE = '+33612345678';

const TABLES = [
  'audit_requests',
  'newsletter_subscribers',
  'lead_magnet_requests',
] as const;

describeDb('Boite de livraison remplie par la migration', () => {
  const base = baseMigreeDeLaSuite(
    [],
    migrationsAnterieuresA('1792136477037-BoiteDeLivraison'),
  );
  const jouer = (sens: 'up' | 'down') =>
    jouerLaMigration(base(), new BoiteDeLivraison1792136477037(), sens);

  const inscrireLesLignesAnterieures = async () => {
    for (const adresse of ADRESSES) {
      await base().query(
        `INSERT INTO "audit_requests" ("websiteName", "contactMethod", "contactValue", "requestId")
         VALUES ('example.com', 'EMAIL', $1, $2)`,
        [adresse, randomUUID()],
      );
      await base().query(
        `INSERT INTO "newsletter_subscribers" ("email", "locale", "source_formation_slug", "status",
           "confirm_token", "unsubscribe_token", "terms_version", "terms_accepted_at", "confirm_token_expires_at")
         VALUES ($1, 'fr', 'ia-solopreneurs', 'pending', $2, $3, '2026-04-10', now(), now() + interval '7 days')`,
        [adresse, randomUUID(), randomUUID()],
      );
      await base().query(
        `INSERT INTO "lead_magnet_requests" ("first_name", "email", "formation_slug", "terms_version",
           "terms_locale", "terms_accepted_at")
         VALUES ('Lea', $1, 'ia-solopreneurs', '2026-04-10', 'fr', now())`,
        [adresse],
      );
    }
    await base().query(
      `INSERT INTO "audit_requests" ("websiteName", "contactMethod", "contactValue", "requestId")
       VALUES ('example.com', 'PHONE', $1, $2)`,
      [TELEPHONE, randomUUID()],
    );
  };

  const boitesRemplies = async (
    table: (typeof TABLES)[number],
  ): Promise<Record<string, string>> => {
    const adresse = table === 'audit_requests' ? '"contactValue"' : '"email"';
    const lignes: { adresse: string; boite: string }[] = await base().query(
      `SELECT ${adresse} AS "adresse", "boite" FROM "${table}"`,
    );
    return Object.fromEntries(lignes.map((l) => [l.adresse, l.boite]));
  };

  const colonnesBoite = async (): Promise<string[]> => {
    const lignes: { table_name: string; is_nullable: string }[] =
      await base().query(
        `SELECT "table_name", "is_nullable" FROM information_schema.columns
         WHERE "column_name" = 'boite' AND "table_name" = ANY($1) ORDER BY "table_name"`,
        [TABLES],
      );
    return lignes.map((l) => `${l.table_name}:${l.is_nullable}`);
  };

  it('ajoute aux trois tables une colonne boite obligatoire et la remplit par la meme regle que le domaine', async () => {
    expect(
      boiteDeLivraison(ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255).length,
    ).toBeGreaterThan(255);
    await inscrireLesLignesAnterieures();

    await jouer('up');

    expect(await colonnesBoite()).toEqual([
      'audit_requests:NO',
      'lead_magnet_requests:NO',
      'newsletter_subscribers:NO',
    ]);
    const attendues = Object.fromEntries(
      ADRESSES.map((adresse) => [adresse, boiteDeLivraison(adresse)]),
    );
    expect(await boitesRemplies('newsletter_subscribers')).toEqual(attendues);
    expect(await boitesRemplies('lead_magnet_requests')).toEqual(attendues);
    expect(await boitesRemplies('audit_requests')).toEqual({
      ...attendues,
      [TELEPHONE]: boiteDeLivraison(TELEPHONE),
    });
  });

  it('retire au retour arriere la colonne et ses index', async () => {
    await jouer('down');

    expect(await colonnesBoite()).toEqual([]);
    const index: unknown[] = await base().query(
      `SELECT 1 FROM pg_indexes WHERE "indexname" LIKE '%boite%'`,
    );
    expect(index).toEqual([]);
  });
});
