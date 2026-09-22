import type { QueryRunner } from 'typeorm';
import { AlignB2CoursV3Presentation1789980000000 } from './1789980000000-AlignB2CoursV3Presentation';

const VERSION_CHERCHEE = 'SELECT "id" FROM "formation_course_contents"';
const ECRAN_MIS_A_JOUR = 'UPDATE "formation_screen_contents"';

function banc(
  cours: unknown[] = [{ id: 'cours-v3' }],
  ecrans: unknown[] = [{ screen_id: 'ecran' }],
): { runner: QueryRunner; query: jest.Mock } {
  const query = jest.fn().mockImplementation((sql: string) => {
    if (sql.startsWith(VERSION_CHERCHEE)) return Promise.resolve(cours);
    if (sql.startsWith(ECRAN_MIS_A_JOUR)) return Promise.resolve(ecrans);
    return Promise.resolve(undefined);
  });
  return { runner: { query } as unknown as QueryRunner, query };
}

function appelsDeMiseAJour(query: jest.Mock): unknown[][] {
  return query.mock.calls
    .filter(([sql]) => String(sql).startsWith(ECRAN_MIS_A_JOUR))
    .map(([, parametres]) => parametres as unknown[]);
}

describe('migration AlignB2CoursV3Presentation', () => {
  const migration = new AlignB2CoursV3Presentation1789980000000();

  it('met à jour les deux textes de la V3 et rétablit le déclencheur', async () => {
    const { runner, query } = banc();

    await migration.up(runner);

    expect(appelsDeMiseAJour(query)).toEqual([
      [
        ['geste'],
        'Avant de recommander un investissement, répondez à trois questions : que mesure chaque chiffre ? Les bases et les périodes sont-elles comparables ? Le recalcul confirme-t-il la recommandation ?',
        'cours-v3',
        'B2-01-A1-03-MISSION',
      ],
      [
        ['presentation', 'props', 'subtitle'],
        'Avant de calculer, repérez pour chaque ligne ce qu’elle mesure, sa base et sa période.',
        'cours-v3',
        'B2-01-A1-04-TABLEAU-DE-BORD',
      ],
    ]);
    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining('SELECT "id"'),
      'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"',
      expect.stringContaining('UPDATE "formation_screen_contents"'),
      expect.stringContaining('UPDATE "formation_screen_contents"'),
      'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"',
    ]);
  });

  it('réapplique les anciennes valeurs au retour arrière', async () => {
    const { runner, query } = banc();

    await migration.down(runner);

    expect(
      appelsDeMiseAJour(query).map((params) => params.slice(0, 2)),
    ).toEqual([
      [
        ['geste'],
        'Avant de calculer : dire ce que mesure chaque chiffre, vérifier qu’il est comparable, le recalculer, puis défendre une recommandation que le comité peut contrôler.',
      ],
      [
        ['presentation', 'props', 'subtitle'],
        'Version préparée par le service commercial, lundi 8 h 40.',
      ],
    ]);
  });

  it('accepte le format de retour PostgreSQL de UPDATE ... RETURNING', async () => {
    const { runner, query } = banc();
    query.mockImplementation((sql: string) => {
      if (sql.startsWith(VERSION_CHERCHEE))
        return Promise.resolve([{ id: 'cours-v3' }]);
      if (sql.startsWith(ECRAN_MIS_A_JOUR))
        return Promise.resolve([[{ screen_id: 'ecran' }], 1]);
      return Promise.resolve(undefined);
    });

    await expect(migration.up(runner)).resolves.toBeUndefined();
  });

  it('ignore un écran historique déjà remplacé', async () => {
    const { runner, query } = banc([{ id: 'cours-v3' }], []);

    await expect(migration.up(runner)).resolves.toBeUndefined();
    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining('SELECT "id"'),
      'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"',
      expect.stringContaining('UPDATE "formation_screen_contents"'),
      expect.stringContaining('UPDATE "formation_screen_contents"'),
      'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"',
    ]);
  });

  it('ignore un cours historique absent ou dupliqué', async () => {
    const { runner, query } = banc([]);

    await expect(migration.up(runner)).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
