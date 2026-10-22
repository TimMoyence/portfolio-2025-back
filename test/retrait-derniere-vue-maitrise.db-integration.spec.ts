import { RetireLaDerniereVueDeLaMaitrise1792576513090 } from '../src/migrations/1792576513090-RetireLaDerniereVueDeLaMaitrise';
import {
  baseMigreeDeLaSuite,
  colonnesDeLaTable,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const MAITRISE = 'formation_mastery';
const CLE_ETUDIANT = '11111111-1111-4111-8111-111111111111';

describeDb(
  'Retrait de la derniere vue de la maitrise sur une base migree',
  () => {
    const base = baseMigreeDeLaSuite(
      [],
      migrationsAnterieuresA('1792576513090-RetireLaDerniereVueDeLaMaitrise'),
    );

    it('retire la colonne et garde la boite de chaque concept', async () => {
      await base().query(
        `INSERT INTO ${MAITRISE} (student_key, concept, boite, derniere_vue, succes, echecs)
       VALUES ($1, 'proportion', 2, now(), 3, 1)`,
        [CLE_ETUDIANT],
      );
      const avant = await colonnesDeLaTable(base(), MAITRISE);

      await jouerLaMigration(
        base(),
        new RetireLaDerniereVueDeLaMaitrise1792576513090(),
        'up',
      );

      expect(avant).toContain('derniere_vue');
      expect(await colonnesDeLaTable(base(), MAITRISE)).toEqual(
        avant.filter((colonne) => colonne !== 'derniere_vue'),
      );
      expect(
        await base().query(`SELECT concept, boite, succes FROM ${MAITRISE}`),
      ).toEqual([{ concept: 'proportion', boite: 2, succes: 3 }]);
    });

    it('rend au retour arriere une derniere vue a chaque ligne', async () => {
      await jouerLaMigration(
        base(),
        new RetireLaDerniereVueDeLaMaitrise1792576513090(),
        'down',
      );

      const lignes: { vue: boolean }[] = await base().query(
        `SELECT derniere_vue IS NOT NULL AS vue FROM ${MAITRISE}`,
      );
      expect(lignes).toEqual([{ vue: true }]);
    });
  },
);
