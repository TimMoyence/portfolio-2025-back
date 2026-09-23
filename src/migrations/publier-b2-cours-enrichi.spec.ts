import type { QueryRunner } from 'typeorm';
import * as StructureCours from '../modules/formations/domain/cours/StructureCours';
import { PublierB2CoursEnrichi1790100000000 } from './1790100000000-PublierB2CoursEnrichi';
import { B2_COURS } from './data/b2-v3.cours';
import { B2_COURS_ENRICHI } from './data/b2-enrichi.cours';

const COURS_INSERE = 'INSERT INTO "formation_course_contents"';
const ECRAN_INSERE = 'INSERT INTO "formation_screen_contents"';
const VERSION_CHERCHEE = 'SELECT "id" FROM "formation_course_contents"';
const SEANCES_COMPTEES = 'FROM "formation_sessions"';
const PUBLICATION_POSEE = 'INSERT INTO "formation_course_publications"';
const PUBLICATION_RAMENEE = 'UPDATE "formation_course_publications"';
const CONTENU_SUPPRIME = 'DELETE FROM "formation_course_contents"';

type Reponse = (sql: string) => unknown;

function banc(reponse: Reponse): { runner: QueryRunner; query: jest.Mock } {
  const query = jest
    .fn()
    .mockImplementation((sql: string) => Promise.resolve(reponse(sql)));
  return { runner: { query } as unknown as QueryRunner, query };
}

function requetes(query: jest.Mock, prefixe: string): unknown[][] {
  return query.mock.calls
    .filter(([sql]) => String(sql).trim().startsWith(prefixe))
    .map(([, parametres]) => parametres as unknown[]);
}

function baseSansLaVersion(sql: string): unknown {
  if (sql.startsWith(VERSION_CHERCHEE)) return [];
  if (sql.startsWith(COURS_INSERE)) return [{ id: 'cours-enrichi' }];
  return undefined;
}

function seancesSurLaVersion(nombre: number): Reponse {
  return (sql: string) =>
    sql.includes(SEANCES_COMPTEES) ? [{ count: nombre }] : undefined;
}

describe('migration PublierB2CoursEnrichi', () => {
  const migration = new PublierB2CoursEnrichi1790100000000();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('P1 · insère la version 3 et ses cinquante-trois écrans dans l ordre du déroulé', async () => {
    const { runner, query } = banc(baseSansLaVersion);

    await migration.up(runner);

    const [cours] = requetes(query, COURS_INSERE);
    expect(cours.slice(0, 2)).toEqual([B2_COURS.slug, 3]);
    expect(
      requetes(query, ECRAN_INSERE).map((parametres) => parametres.slice(0, 3)),
    ).toEqual(
      B2_COURS_ENRICHI.ecrans.map((ecran, position) => [
        'cours-enrichi',
        position,
        ecran.screenId,
      ]),
    );
  });

  it('P1 · publie la version 3 dès son insertion', async () => {
    const { runner, query } = banc(baseSansLaVersion);

    await migration.up(runner);

    expect(requetes(query, PUBLICATION_POSEE)).toEqual([[B2_COURS.slug, 3]]);
  });

  it('P1 · republie sans réinsérer une version 3 déjà en base', async () => {
    const { runner, query } = banc((sql) =>
      sql.startsWith(VERSION_CHERCHEE) ? [{ id: 'cours-enrichi' }] : undefined,
    );

    await migration.up(runner);

    expect(requetes(query, COURS_INSERE)).toEqual([]);
    expect(requetes(query, PUBLICATION_POSEE)).toEqual([[B2_COURS.slug, 3]]);
  });

  it('P1 · refuse d insérer un contenu que la validation du domaine rejette', async () => {
    jest.spyOn(StructureCours, 'verifierStructure').mockReturnValueOnce([
      {
        regle: 'notes-formateur',
        ecran: 'B2-01-A1-03-MISSION',
        raison: 'rubrique manquante',
      },
    ]);
    const { runner, query } = banc(baseSansLaVersion);

    await expect(migration.up(runner)).rejects.toThrow(
      /notes-formateur \(B2-01-A1-03-MISSION\) : rubrique manquante/,
    );
    expect(requetes(query, COURS_INSERE)).toEqual([]);
  });

  it('P1 · refuse son retour arrière quand une séance sert la version 3', async () => {
    const { runner, query } = banc(seancesSurLaVersion(1));

    await expect(migration.down(runner)).rejects.toThrow(
      'une séance sert la version 3',
    );
    expect(requetes(query, CONTENU_SUPPRIME)).toEqual([]);
  });

  it('P1 · republie la version 1 puis supprime la version 3 au retour arrière', async () => {
    const { runner, query } = banc(seancesSurLaVersion(0));

    await migration.down(runner);

    expect(requetes(query, PUBLICATION_RAMENEE)).toEqual([
      [B2_COURS.slug, B2_COURS.version, 3],
    ]);
    expect(requetes(query, CONTENU_SUPPRIME)).toEqual([[B2_COURS.slug, 3]]);
    expect(
      query.mock.calls
        .map(([sql]) => String(sql))
        .filter((sql) => sql.startsWith('ALTER'))
        .map((sql) => sql.split(' ').at(-3)),
    ).toEqual(['DISABLE', 'DISABLE', 'ENABLE', 'ENABLE']);
  });

  it('P1 · ne ramène la publication à la version 1 que si la version 3 est encore celle publiée', async () => {
    const { runner, query } = banc(seancesSurLaVersion(0));

    await migration.down(runner);

    const [ramenee] = query.mock.calls
      .map(([sql]) => String(sql).trim())
      .filter((sql) => sql.startsWith(PUBLICATION_RAMENEE));
    expect(ramenee.replace(/\s+/g, ' ')).toContain(
      'WHERE "slug" = $1 AND "version_publiee" = $3',
    );
  });
});
