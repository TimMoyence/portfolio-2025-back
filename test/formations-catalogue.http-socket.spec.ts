import request from 'supertest';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import { projeterCatalogue } from '../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { buildCoursStocke } from './factories/cours-stocke.factory';
import {
  ecartsAuSchemaDeLaRoute,
  installerApplicationSurCatalogue,
} from './helpers/application-sur-catalogue';
import { clesDuCorrigeDans, clesImbriquees } from './helpers/cles-du-corrige';
import { PREFIXE_API } from './helpers/formations-harness';
import { attendreVersionServie } from './helpers/schema-openapi';

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
  const app = installerApplicationSurCatalogue(COURS);

  const lire = (slug: string) =>
    request(app().getHttpServer() as Parameters<typeof request>[0]).get(
      `/${PREFIXE_API}/formations/catalogue/${slug}`,
    );

  it('sert sans authentification le sujet public du cours publie', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    expect(reponse.body).toEqual({
      ...projeterCatalogue(COURS),
      version: 1,
      publieLe: expect.any(String),
    });
  });

  it('verrouille au catalogue l écran stocké sans diffusion, réservé par défaut à la séance (SEC-4)', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    const servis = (reponse.body as { ecrans: { id: string; type: string }[] })
      .ecrans;
    expect(servis.map(({ id, type }) => [id, type])).toEqual(
      tirer(COURS, 0).sujet.ecrans.map(({ id }) => [id, 'ecran-verrouille']),
    );
  });

  it('sert la version publiee et sa date de bascule au sitemap (H1)', async () => {
    const reponse = await lire(COURS.slug).expect(200);

    attendreVersionServie(reponse.body, 1);
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
    const reponse = await lire(COURS.slug).expect(200);

    expect(
      ecartsAuSchemaDeLaRoute(app(), '/catalogue/{slug}', reponse.body),
    ).toEqual([]);
  });
});
