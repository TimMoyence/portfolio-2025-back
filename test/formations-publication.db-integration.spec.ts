import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { empreinteCanonique } from '../src/modules/formations/domain/cours/EmpreinteCanonique';
import { buildContenuAPublierB2_01 } from './factories/cours-b2-01.factory';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  routeFormations,
  serveurHttpDe,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const CONTENU = buildContenuAPublierB2_01();
const SLUG = CONTENU.slug;
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const OK = 200;
const CREE = 201;
const INTROUVABLE = 404;
const SLUG_JAMAIS_PUBLIE = 'cours-insere-sans-publication';

interface CataloguePublic {
  version: number;
  publieLe: string;
}

interface ReponseOuverture {
  sessionId: string;
}

interface LigneDeVersion {
  version: number;
  empreinte: string | null;
}

function contenuCorrige(): typeof CONTENU {
  const [premier, ...suivants] = CONTENU.ecrans;
  return {
    ...CONTENU,
    ecrans: [
      { ...premier, notes: `${premier.notes} Relance ajoutée par la QA.` },
      ...suivants,
    ],
  };
}

describeDb('Synchronisation du cours publié (db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;

  const serveur = () => serveurHttpDe(app);

  const route = routeFormations;

  const versionsEnBase = async (): Promise<LigneDeVersion[]> =>
    await contexte.dataSource.query(
      `SELECT "version", "empreinte" FROM "formation_course_contents"
       WHERE "slug" = $1 ORDER BY "version"`,
      [SLUG],
    );

  const ouvrirSeance = async (): Promise<string> => {
    const ouverture = await request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({ courseSlug: SLUG })
      .expect(CREE);
    return (ouverture.body as ReponseOuverture).sessionId;
  };

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
    app = await monterApplicationFormations(
      { ...contexte, mailer: createMockFormationMailer() },
      contexte.catalogue,
    );
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
  });

  it('publie le cours du fichier avec son empreinte sur une base neuve', async () => {
    expect(await versionsEnBase()).toEqual([
      { version: 1, empreinte: empreinteCanonique(CONTENU) },
    ]);
    expect(await contexte.publication.empreintePubliee(SLUG)).toBe(
      empreinteCanonique(CONTENU),
    );
  });

  it('ne publie rien quand le fichier du cours n’a pas changé', async () => {
    const issues = await contexte.synchroniser([CONTENU]);

    expect(issues).toEqual([{ slug: SLUG, statut: 'a-jour' }]);
    expect(await versionsEnBase()).toHaveLength(1);
  });

  it('sert le contenu publié et sa date de publication au catalogue public', async () => {
    const reponse = await request(serveur())
      .get(route(`/catalogue/${SLUG}`))
      .expect(OK);

    const servi = reponse.body as CataloguePublic;
    expect(servi.version).toBe(1);
    expect(Date.parse(servi.publieLe)).not.toBeNaN();
  });

  it('ne sert ni au public ni à une séance un slug inséré sans publication', async () => {
    await contexte.dataSource.query(
      `INSERT INTO "formation_course_contents"
           ("slug", "version", "titre", "niveau", "duree_minutes", "concepts")
         VALUES ($1, 1, 'Brouillon jamais publie', 'B2', 5, '["proportion"]'::jsonb)`,
      [SLUG_JAMAIS_PUBLIE],
    );

    const publique = await request(serveur()).get(
      route(`/catalogue/${SLUG_JAMAIS_PUBLIE}`),
    );
    const parUnFormateur = await request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({ courseSlug: SLUG_JAMAIS_PUBLIE });

    expect({
      publique: publique.status,
      seance: parUnFormateur.status,
    }).toEqual({ publique: INTROUVABLE, seance: INTROUVABLE });
  });

  it('publie le cours corrigé sans toucher au contenu des séances déjà ouvertes', async () => {
    const ouverteAvant = await ouvrirSeance();
    const corrige = contenuCorrige();

    const issues = await contexte.synchroniser([corrige]);

    expect(issues).toEqual([{ slug: SLUG, statut: 'publie', version: 2 }]);
    expect(await versionsEnBase()).toEqual([
      { version: 1, empreinte: empreinteCanonique(CONTENU) },
      { version: 2, empreinte: empreinteCanonique(corrige) },
    ]);
    const seance = await contexte.sessions.findById(ouverteAvant);
    const coursDeLaSeance = await contexte.catalogue.trouver(
      SLUG,
      seance?.courseVersion,
    );
    expect(coursDeLaSeance?.ecrans[0].notes).toBe(CONTENU.ecrans[0].notes);
  });

  it('ouvre les nouvelles séances sur le cours corrigé', async () => {
    const seance = await contexte.sessions.findById(await ouvrirSeance());
    const cours = await contexte.catalogue.trouver(SLUG, seance?.courseVersion);

    expect(cours?.ecrans[0].notes).toBe(contenuCorrige().ecrans[0].notes);
  });

  it('ne publie qu une version quand deux instances synchronisent le même cours en même temps', async () => {
    const [premier, ...suivants] = CONTENU.ecrans;
    const recorrige = {
      ...CONTENU,
      ecrans: [
        { ...premier, notes: `${premier.notes} Seconde relance de la QA.` },
        ...suivants,
      ],
    };

    const issues = await Promise.all([
      contexte.synchroniser([recorrige]),
      contexte.synchroniser([recorrige]),
    ]);

    for (const issue of issues.flat()) {
      expect([
        { slug: SLUG, statut: 'a-jour' },
        { slug: SLUG, statut: 'publie', version: 3 },
      ]).toContainEqual(issue);
    }
    const versions = await versionsEnBase();
    expect(versions.map(({ version }) => version)).toEqual([1, 2, 3]);
    expect(versions[2].empreinte).toBe(empreinteCanonique(recorrige));
  });
});
