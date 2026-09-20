import type { QueryRunner } from 'typeorm';
import * as StructureCours from '../modules/formations/domain/cours/StructureCours';
import { InsertB2CoursV31789893879954 } from './1789893879954-InsertB2CoursV3';
import { B2_COURS_V3 } from './data/b2-v3.cours';

const ECRANS_DE_LA_V3 = 52;
const COURS_INSERE = 'INSERT INTO "formation_course_contents"';
const ECRAN_INSERE = 'INSERT INTO "formation_screen_contents"';
const VERSION_CHERCHEE = 'SELECT "id" FROM "formation_course_contents"';
const SEANCES_COMPTEES = 'FROM "formation_sessions"';
const PUBLICATIONS_COMPTEES = 'FROM "formation_course_publications"';

type Reponse = (sql: string) => unknown;

function banc(reponse: Reponse): { runner: QueryRunner; query: jest.Mock } {
  const query = jest
    .fn()
    .mockImplementation((sql: string) => Promise.resolve(reponse(sql)));
  return { runner: { query } as unknown as QueryRunner, query };
}

function baseSansLaV3(sql: string): unknown {
  if (sql.startsWith(VERSION_CHERCHEE)) return [];
  if (sql.startsWith(COURS_INSERE)) return [{ id: 'cours-v3' }];
  return undefined;
}

function baseAvecLaV3(sql: string): unknown {
  return sql.startsWith(VERSION_CHERCHEE) ? [{ id: 'cours-v3' }] : undefined;
}

function comptes(seances: number, publications: number): Reponse {
  return (sql: string) => {
    if (sql.includes(SEANCES_COMPTEES)) return [{ count: seances }];
    if (sql.includes(PUBLICATIONS_COMPTEES)) return [{ count: publications }];
    return undefined;
  };
}

function requetes(query: jest.Mock, prefixe: string): unknown[][] {
  return query.mock.calls
    .filter(([sql]) => String(sql).startsWith(prefixe))
    .map(([, parametres]) => parametres as unknown[]);
}

describe('migration InsertB2CoursV3', () => {
  const migration = new InsertB2CoursV31789893879954();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('insère le cours et ses cinquante-deux écrans dans l ordre du déroulé', async () => {
    const { runner, query } = banc(baseSansLaV3);

    await migration.up(runner);

    const [cours] = requetes(query, COURS_INSERE);
    const ecrans = requetes(query, ECRAN_INSERE);
    expect(cours.slice(0, 5)).toEqual([
      B2_COURS_V3.slug,
      B2_COURS_V3.version,
      B2_COURS_V3.titre,
      B2_COURS_V3.niveau,
      B2_COURS_V3.dureeMinutes,
    ]);
    expect(ecrans).toHaveLength(ECRANS_DE_LA_V3);
    expect(ecrans.map((parametres) => parametres.slice(0, 6))).toEqual(
      B2_COURS_V3.ecrans.map((ecran, position) => [
        'cours-v3',
        position,
        ecran.screenId,
        ecran.titre,
        ecran.diffusion,
        ecran.brique,
      ]),
    );
  });

  it('persiste les remédiations, les médias et les notes formateur de chaque écran', async () => {
    const { runner, query } = banc(baseSansLaV3);

    await migration.up(runner);

    const [cours] = requetes(query, COURS_INSERE);
    expect(cours.slice(6)).toEqual([
      JSON.stringify(B2_COURS_V3.remediations),
      JSON.stringify(B2_COURS_V3.medias),
    ]);
    expect(
      requetes(query, ECRAN_INSERE).map((parametres) => parametres[8]),
    ).toEqual(B2_COURS_V3.ecrans.map((ecran) => ecran.notes));
  });

  it('ne réinsère rien quand la version 3 est déjà en base', async () => {
    const { runner, query } = banc(baseAvecLaV3);

    await migration.up(runner);

    expect(query).toHaveBeenCalledTimes(1);
    expect(requetes(query, COURS_INSERE)).toEqual([]);
  });

  it('refuse d insérer un contenu que la validation du domaine rejette', async () => {
    const violation = {
      regle: 'notes-formateur',
      ecran: 'B2-01-A1-01-DIAGNOSTIC',
      raison: 'rubrique manquante',
    } as const;
    jest
      .spyOn(StructureCours, 'verifierStructure')
      .mockReturnValueOnce([violation]);
    const { runner, query } = banc(baseSansLaV3);

    await expect(migration.up(runner)).rejects.toThrow(
      /notes-formateur \(B2-01-A1-01-DIAGNOSTIC\) : rubrique manquante/,
    );
    expect(requetes(query, COURS_INSERE)).toEqual([]);
    expect(requetes(query, ECRAN_INSERE)).toEqual([]);
  });

  it('refuse son retour arrière quand une séance sert la version 3', async () => {
    const { runner, query } = banc(comptes(1, 0));

    await expect(migration.down(runner)).rejects.toThrow(
      'utilise par une seance',
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('refuse son retour arrière quand la version 3 est publiée', async () => {
    const { runner, query } = banc(comptes(0, 1));

    await expect(migration.down(runner)).rejects.toThrow('contenu publie');
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('supprime la version 3 en désactivant puis en rétablissant les déclencheurs', async () => {
    const { runner, query } = banc(comptes(0, 0));

    await migration.down(runner);

    expect(
      query.mock.calls
        .map(([sql]) => String(sql).replace(/\s+/g, ' ').trim())
        .filter((sql) => sql.startsWith('ALTER') || sql.startsWith('DELETE')),
    ).toEqual([
      'ALTER TABLE "formation_screen_contents" DISABLE TRIGGER "trg_formation_screen_immutable"',
      'ALTER TABLE "formation_course_contents" DISABLE TRIGGER "trg_formation_course_immutable"',
      'DELETE FROM "formation_course_contents" WHERE "slug" = $1 AND "version" = $2',
      'ALTER TABLE "formation_course_contents" ENABLE TRIGGER "trg_formation_course_immutable"',
      'ALTER TABLE "formation_screen_contents" ENABLE TRIGGER "trg_formation_screen_immutable"',
    ]);
  });
});
