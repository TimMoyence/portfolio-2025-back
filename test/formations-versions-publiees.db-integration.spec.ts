import { B2_COURS_V3 } from '../src/migrations/data/b2-v3.cours';
import type { ContenuDeCoursBrut } from '../src/modules/formations/domain/cours/CoursStocke';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import { contenusPublies } from './helpers/portrait-tirages-b2';

interface VersionPubliee {
  readonly id: string;
  readonly slug: string;
  readonly version: number;
  readonly titre: string;
  readonly niveau: string;
  readonly duree_minutes: number;
  readonly concepts: string[];
}

interface EcranPublie {
  readonly screen_id: string;
  readonly brique: string;
  readonly duree_minutes: number;
  readonly concepts: string[];
  readonly notes: string;
  readonly proprietes: Record<string, unknown>;
}

const HORS_HISTORIQUE = [B2_COURS_V3.slug, B2_COURS_V3.version] as const;

describeDb('versions publiées du catalogue de formations', () => {
  let contexte: ContexteFormations;

  const versionsPubliees = async (): Promise<VersionPubliee[]> =>
    await contexte.dataSource.query(
      `SELECT "id", "slug", "version", "titre", "niveau", "duree_minutes", "concepts"
       FROM "formation_course_contents" ORDER BY "slug", "version"`,
    );

  const versionsHistoriques = async (): Promise<VersionPubliee[]> =>
    (await versionsPubliees()).filter(
      (version) =>
        version.slug !== B2_COURS_V3.slug ||
        version.version !== B2_COURS_V3.version,
    );

  const contenuBrut = async (
    version: VersionPubliee,
  ): Promise<ContenuDeCoursBrut> => {
    const ecrans: EcranPublie[] = await contexte.dataSource.query(
      `SELECT "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes"
       FROM "formation_screen_contents" WHERE "course_id" = $1 ORDER BY "position"`,
      [version.id],
    );
    return {
      slug: version.slug,
      version: version.version,
      titre: version.titre,
      niveau: version.niveau,
      dureeMinutes: version.duree_minutes,
      concepts: version.concepts,
      ecrans: ecrans.map((ecran) => ({
        screenId: ecran.screen_id,
        brique: ecran.brique,
        dureeMinutes: ecran.duree_minutes,
        concepts: ecran.concepts,
        notes: ecran.notes,
        proprietes: ecran.proprietes,
      })),
    };
  };

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => contexte.fermer());

  it('lit par le catalogue chaque version publiée de chaque cours', async () => {
    const versions = await versionsPubliees();

    expect(versions.length).toBeGreaterThan(0);
    for (const { slug, version } of versions) {
      const cours = await contexte.catalogue.trouver(slug, version);
      expect(cours?.ecrans.length).toBeGreaterThan(0);
    }
  });

  it('laisse les versions historiques sans titre, en diffusion catalogue, sans remédiation ni média', async () => {
    const ecrans: { nombre: number }[] = await contexte.dataSource.query(
      `SELECT COUNT(*)::int AS "nombre" FROM "formation_screen_contents" AS "ecran"
       JOIN "formation_course_contents" AS "cours" ON "cours"."id" = "ecran"."course_id"
       WHERE NOT ("cours"."slug" = $1 AND "cours"."version" = $2)
         AND ("ecran"."titre" IS NOT NULL OR "ecran"."diffusion" <> 'catalogue')`,
      [...HORS_HISTORIQUE],
    );
    const cours: { nombre: number }[] = await contexte.dataSource.query(
      `SELECT COUNT(*)::int AS "nombre" FROM "formation_course_contents"
       WHERE NOT ("slug" = $1 AND "version" = $2)
         AND ("remediations" <> '{}'::jsonb OR "medias" <> '[]'::jsonb)`,
      [...HORS_HISTORIQUE],
    );

    expect([ecrans[0].nombre, cours[0].nombre]).toEqual([0, 0]);
  });

  it('garde les contenus figés des tests dorés identiques à la base migrée', async () => {
    const lus: ContenuDeCoursBrut[] = [];
    for (const version of await versionsHistoriques()) {
      lus.push(await contenuBrut(version));
    }

    expect(lus).toEqual(contenusPublies());
  });
});
