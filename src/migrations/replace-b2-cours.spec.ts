import type { QueryRunner } from 'typeorm';
import { ReplaceB2Cours1790000000000 } from './1790000000000-ReplaceB2Cours';
import { B2_COURS } from './data/b2-v3.cours';

function banc(): { runner: QueryRunner; query: jest.Mock } {
  const query = jest.fn().mockImplementation((sql: string) => {
    if (sql.includes('FROM "formation_sessions"')) {
      return Promise.resolve([{ count: 0 }]);
    }
    if (sql.startsWith('INSERT INTO "formation_course_contents"')) {
      return Promise.resolve([{ id: 'cours-b2-01' }]);
    }
    return Promise.resolve(undefined);
  });
  return { runner: { query } as unknown as QueryRunner, query };
}

describe('migration de remplacement du cours B2-01', () => {
  const migration = new ReplaceB2Cours1790000000000();

  it('remplace le contenu existant, réinsère le déroulé et publie la base unique', async () => {
    const { runner, query } = banc();

    await migration.up(runner);

    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('DELETE FROM "formation_course_contents"'),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.filter(([sql]) =>
        String(sql).startsWith('INSERT INTO "formation_screen_contents"'),
      ),
    ).toHaveLength(B2_COURS.ecrans.length);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).startsWith('INSERT INTO "formation_course_publications"'),
      ),
    ).toBe(true);
  });

  it('refuse le remplacement si une séance B2-01 existe déjà', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('FROM "formation_sessions"')) {
        return Promise.resolve([{ count: 1 }]);
      }
      return Promise.resolve(undefined);
    });

    await expect(
      migration.up({ query } as unknown as QueryRunner),
    ).rejects.toThrow('des séances existent déjà');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('supprime le contenu et la publication au retour arrière quand aucune séance n existe', async () => {
    const { runner, query } = banc();

    await migration.down(runner);

    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('DELETE FROM "formation_course_publications"'),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('DELETE FROM "formation_course_contents"'),
      ),
    ).toBe(true);
  });
});
