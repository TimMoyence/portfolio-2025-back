import { RetireLeProfilDuGuide1792400000000 } from '../src/migrations/1792400000000-RetireLeProfilDuGuide';
import {
  baseMigreeDeLaSuite,
  colonnesDeLaTable,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const DEMANDES = 'lead_magnet_requests';

describeDb(
  'Retrait du profil d interaction du guide sur une base migree',
  () => {
    const base = baseMigreeDeLaSuite(
      [],
      migrationsAnterieuresA('1792400000000-RetireLeProfilDuGuide'),
    );

    const profils = async (): Promise<unknown[]> => {
      const lignes: { profile: unknown }[] = await base().query(
        `SELECT profile FROM ${DEMANDES}`,
      );
      return lignes.map(({ profile }) => profile);
    };

    it('retire la colonne du profil et garde chaque demande du guide', async () => {
      await base().query(
        `INSERT INTO ${DEMANDES}
         (first_name, email, boite, formation_slug, terms_version, terms_locale, terms_accepted_at, profile)
       VALUES ('Marie', 'marie@example.com', 'marie@example.com', 'ia-solopreneurs', '2026-04-10', 'fr', now(), '{"aiLevel":"debutant"}')`,
      );
      const avant = await colonnesDeLaTable(base(), DEMANDES);

      await jouerLaMigration(
        base(),
        new RetireLeProfilDuGuide1792400000000(),
        'up',
      );

      expect(avant).toContain('profile');
      expect(await colonnesDeLaTable(base(), DEMANDES)).toEqual(
        avant.filter((colonne) => colonne !== 'profile'),
      );
      expect(await base().query(`SELECT first_name FROM ${DEMANDES}`)).toEqual([
        { first_name: 'Marie' },
      ]);
    });

    it('rend au retour arriere un profil vide a chaque demande', async () => {
      await jouerLaMigration(
        base(),
        new RetireLeProfilDuGuide1792400000000(),
        'down',
      );

      expect(await profils()).toEqual([{}]);
    });
  },
);
