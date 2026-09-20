import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { creerCatalogueDeTest } from './factories/cours.factory';
import { buildCoursStocke } from './factories/cours-stocke.factory';
import { createMockDepotsFormations } from './factories/formation.factory';
import { clesDuCorrigeDans, clesImbriquees } from './helpers/cles-du-corrige';
import {
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { ecartsAuSchemaDeReponse } from './helpers/schema-openapi';

const COURS = lireCoursStocke(buildCoursStocke());
const DONNEES_DU_FORMATEUR = [
  'notes',
  'guide',
  'correction',
  'interaction',
  'correctIndex',
  'explanation',
];

describe('Catalogue public des formations (e2e http socket)', () => {
  let app: INestApplication;

  const lire = (slug: string) =>
    request(app.getHttpServer() as Parameters<typeof request>[0]).get(
      `/${PREFIXE_API}/formations/catalogue/${slug}`,
    );

  beforeAll(async () => {
    app = await monterApplicationFormations(
      createMockDepotsFormations(),
      creerCatalogueDeTest(COURS),
    );
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it('sert sans authentification le sujet public du cours publie', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    expect(reponse.body).toEqual({
      ...tirer(COURS, 0).sujet,
      version: 1,
      publieLe: expect.any(String),
    });
  });

  it('sert la version publiee et sa date de bascule au sitemap (H1)', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    const servi = reponse.body as { version: number; publieLe: string };
    expect(servi.version).toBe(1);
    expect(Date.parse(servi.publieLe)).not.toBeNaN();
  });

  it('ne livre ni donnee du formateur, ni quiz note, ni corrige', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    expect({
      donneesFormateur: DONNEES_DU_FORMATEUR.filter((cle) =>
        clesImbriquees(reponse.body).includes(cle),
      ),
      clesDuCorrige: clesDuCorrigeDans(reponse.body),
    }).toEqual({ donneesFormateur: [], clesDuCorrige: [] });
  });

  it('rend 404 pour un cours absent du catalogue', async () => {
    const reponse = await lire('cours-inconnu').expect(404);

    expect(reponse.body).toMatchObject({
      status: 404,
      detail: 'Cours introuvable: cours-inconnu',
    });
  });

  it('documente exactement la forme rendue', async () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('formations').build(),
    );
    const reponse = await lire(COURS.slug).expect(200);

    expect(
      ecartsAuSchemaDeReponse(document, '/catalogue/{slug}', reponse.body),
    ).toEqual([]);
  });
});
