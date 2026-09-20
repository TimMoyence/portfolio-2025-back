import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
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
const NON_AUTORISE = 401;
const INTERDIT = 403;
const INTROUVABLE = 404;
const CONFLIT = 409;
const SLUG_JAMAIS_PUBLIE = 'cours-insere-apres-l-amorcage';

interface CataloguePublic {
  version: number;
  publieLe: string;
}

interface Publication {
  slug: string;
  versionPubliee: number;
  publieeLe: string;
}

interface ReponseOuverture {
  sessionId: string;
}

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb(
  'Publication reversible du catalogue (B25, H1, db integration)',
  () => {
    silenceNestLogger(['log', 'warn', 'error']);

    let contexte: ContexteFormations;
    let app: INestApplication;

    const serveur = (): Parameters<typeof request>[0] =>
      app.getHttpServer() as Parameters<typeof request>[0];

    const route = (chemin: string): string =>
      `/${PREFIXE_API}/formations${chemin}`;

    const publier = (version: number, identite: string): Test =>
      request(serveur())
        .put(route(`/catalogue/${SLUG}/publication`))
        .set(EN_TETE_IDENTITE, identite)
        .send({ version });

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

    it('amorce la publication de chaque slug a sa plus haute version', async () => {
      const lignes: { slug: string; version_publiee: number }[] =
        await contexte.dataSource.query(
          'SELECT slug, version_publiee FROM formation_course_publications',
        );

      expect(lignes).toContainEqual({ slug: SLUG, version_publiee: 2 });
    });

    it('sert la version publiee et sa date de bascule au catalogue public (H1)', async () => {
      const reponse = await catalogue().expect(OK);

      const servi = reponse.body as CataloguePublic;
      expect(servi.version).toBe(2);
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

    it('laisse la V3 migree hors publication tant que personne ne bascule (AC-36)', async () => {
      const presente: { version: number }[] = await contexte.dataSource.query(
        'SELECT version FROM formation_course_contents WHERE slug = $1 AND version = $2',
        [SLUG, V3],
      );
      const servi = (await catalogue().expect(OK)).body as CataloguePublic;
      const ouverture = await ouvrirSeance().expect(CREE);

      const seance = await contexte.sessions.findById(
        (ouverture.body as ReponseOuverture).sessionId,
      );
      expect({
        migree: presente.length,
        servi: servi.version,
        seance: seance?.courseVersion,
      }).toEqual({ migree: 1, servi: 2, seance: 2 });
    });

    it('bascule vers la version 1 puis rebascule vers la 2 sans rien supprimer', async () => {
      const bascule = await publier(1, `${ADMIN}:admin`).expect(OK);
      const apresBascule = (await catalogue().expect(OK))
        .body as CataloguePublic;

      expect((bascule.body as Publication).versionPubliee).toBe(1);
      expect(apresBascule.version).toBe(1);

      await publier(2, `${ADMIN}:admin`).expect(OK);
      const apresRebascule = (await catalogue().expect(OK))
        .body as CataloguePublic;

      expect(apresRebascule.version).toBe(2);
      const versions: { version: number }[] = await contexte.dataSource.query(
        'SELECT version FROM formation_course_contents WHERE slug = $1 ORDER BY version',
        [SLUG],
      );
      expect(versions.map((ligne) => ligne.version)).toEqual([1, 2, V3]);
    });

    it('ouvre les seances sur la version publiee', async () => {
      await publier(1, `${ADMIN}:admin`).expect(OK);

      const ouverture = await ouvrirSeance().expect(CREE);

      const seance = await contexte.sessions.findById(
        (ouverture.body as ReponseOuverture).sessionId,
      );
      expect(seance?.courseVersion).toBe(1);
      await publier(2, `${ADMIN}:admin`).expect(OK);
      const encore = await contexte.sessions.findById(
        (ouverture.body as ReponseOuverture).sessionId,
      );
      expect(encore?.courseVersion).toBe(1);
    });

    it('laisse l administrateur ouvrir une seance sur une version non publiee', async () => {
      await publier(2, `${ADMIN}:admin`).expect(OK);

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

    it('refuse la publication a un formateur et a un anonyme', async () => {
      const parFormateur = await publier(1, `${FORMATEUR}:teacher`);
      const anonyme = await request(serveur())
        .put(route(`/catalogue/${SLUG}/publication`))
        .send({ version: 1 });

      expect(parFormateur.status).toBe(INTERDIT);
      expect(anonyme.status).toBe(NON_AUTORISE);
    });

    it('refuse une version inconnue du cours', async () => {
      const refus = await publier(9, `${ADMIN}:admin`);

      expect(refus.status).toBe(CONFLIT);
      expect(codeDe(refus)).toBe('VERSION_NON_PUBLIABLE');
    });
  },
);
