import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
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
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const SLUG = 'b2-01-traitement-information-chiffree';
const V3 = 3;
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const ADMIN = 'f6666666-6666-4666-8666-666666666666';
const OK = 200;
const CREE = 201;
const INTERDIT = 403;
const INTROUVABLE = 404;
const SLUG_JAMAIS_PUBLIE = 'cours-insere-apres-l-amorcage';

interface CataloguePublic {
  version: number;
  publieLe: string;
}

interface ReponseOuverture {
  sessionId: string;
}

describeDb('Publication du catalogue par la migration (db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const catalogue = (): Test =>
    request(serveur()).get(route(`/catalogue/${SLUG}`));

  const ouvrirSeance = (version?: number): Test =>
    request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${ADMIN}:admin:teacher`)
      .send({ courseSlug: SLUG, ...(version ? { version } : {}) });

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

  it('publie la V3 des l installation de la migration', async () => {
    const lignes: { slug: string; version_publiee: number }[] =
      await contexte.dataSource.query(
        'SELECT slug, version_publiee FROM formation_course_publications',
      );

    expect(lignes).toContainEqual({ slug: SLUG, version_publiee: V3 });
  });

  it('sert la version publiee et sa date de bascule au catalogue public', async () => {
    const reponse = await catalogue().expect(OK);

    const servi = reponse.body as CataloguePublic;
    expect(servi.version).toBe(V3);
    expect(Date.parse(servi.publieLe)).not.toBeNaN();
  });

  it('ne sert ni au public ni a une seance un slug insere sans ligne de publication', async () => {
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

  it('ouvre les seances du formateur sur la version publiee', async () => {
    const ouverture = await request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({ courseSlug: SLUG })
      .expect(CREE);

    const seance = await contexte.sessions.findById(
      (ouverture.body as ReponseOuverture).sessionId,
    );
    expect(seance?.courseVersion).toBe(V3);
  });

  it('laisse l administrateur ouvrir une seance sur une version anterieure', async () => {
    const ouverture = await ouvrirSeance(1).expect(CREE);

    const seance = await contexte.sessions.findById(
      (ouverture.body as ReponseOuverture).sessionId,
    );
    expect(seance?.courseVersion).toBe(1);
  });

  it('refuse le champ version a un formateur sans role administrateur', async () => {
    const refus = await request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({ courseSlug: SLUG, version: 1 });

    expect(refus.status).toBe(INTERDIT);
  });
});
