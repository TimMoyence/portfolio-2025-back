import type { QueryRunner } from 'typeorm';
import { AlignB2CoursV3Samir1789990000000 } from './1789990000000-AlignB2CoursV3Samir';

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

function appelDeMiseAJour(query: jest.Mock): unknown[] {
  const appel = query.mock.calls.find(([sql]) =>
    String(sql).startsWith(ECRAN_MIS_A_JOUR),
  );
  return (appel?.[1] as unknown[]) ?? [];
}

describe('migration AlignB2CoursV3Samir', () => {
  const migration = new AlignB2CoursV3Samir1789990000000();

  it('met à jour le titre et la définition réglable de la diapositive de Samir', async () => {
    const { runner, query } = banc();

    await migration.up(runner);

    expect(appelDeMiseAJour(query)).toEqual([
      'La diapositive de Samir — axe réglable',
      'Diapositive de Samir : marge brute et axe réglable',
      'Service commercial d’Atelier Rivage (données fictives).',
      'Réglez l’origine et le haut de l’axe pour voir comment l’échelle transforme la lecture, sans changer les valeurs.',
      'cours-v3',
      'B2-01-A2-02-ORIGINE-AXE',
    ]);
    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining('SELECT "id"'),
      'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"',
      expect.stringContaining('UPDATE "formation_screen_contents"'),
      'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"',
    ]);
  });

  it('rétablit les textes précédents au retour arrière', async () => {
    const { runner, query } = banc();

    await migration.down(runner);

    expect(appelDeMiseAJour(query)).toEqual([
      'Déplacez l’origine de l’axe',
      'Marge brute d’Atelier Rivage, 2022–2025 : déplacez l’origine et le haut de l’axe',
      'Données fictives Atelier Rivage',
      'Courbe de la marge brute de 2022 à 2025 ; deux curseurs règlent le bas et le haut de l’axe vertical ; au départ, l’axe va de 284 000 € à 292 000 €, comme sur la diapositive de Samir.',
      'cours-v3',
      'B2-01-A2-02-ORIGINE-AXE',
    ]);
  });

  it('ignore un écran historique déjà remplacé', async () => {
    const { runner, query } = banc([{ id: 'cours-v3' }], []);

    await expect(migration.up(runner)).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(4);
  });
});
