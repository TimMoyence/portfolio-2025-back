import request from 'supertest';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { GRAINE_DU_CATALOGUE } from '../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { clesDuCorrigeDans } from './helpers/cles-du-corrige';
import { buildCoursStocke } from './factories/cours-stocke.factory';
import {
  ecartsAuSchemaDeLaRoute,
  installerApplicationSurCatalogue,
} from './helpers/application-sur-catalogue';
import {
  EN_TETE_IDENTITE,
  routeFormations,
  serveurHttpDe,
} from './helpers/formations-harness';

const COURS = lireCoursStocke(buildCoursStocke());
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111:teacher';
const ADMINISTRATEUR = 'f6666666-6666-4666-8666-666666666666:admin';
const UTILISATEUR = 'b2222222-2222-4222-8222-222222222222:user';

interface Livret {
  readonly sujet: unknown;
}

describe('Livret papier d un cours publié (e2e http socket)', () => {
  const app = installerApplicationSurCatalogue(COURS);

  const lire = (slug: string, identite?: string): request.Test => {
    const requete = request(serveurHttpDe(app())).get(
      routeFormations(`/livrets/${slug}`),
    );
    return identite === undefined
      ? requete
      : requete.set(EN_TETE_IDENTITE, identite);
  };

  it('sert au formateur le sujet et le corrigé du tirage du catalogue', async () => {
    const reponse = await lire(COURS.slug, FORMATEUR).expect(200);

    expect(reponse.body).toEqual({
      version: 1,
      sujet: tirer(COURS, GRAINE_DU_CATALOGUE).sujet,
      corrige: deroulePresentateur(COURS, GRAINE_DU_CATALOGUE),
    });
  });

  it('ne glisse aucun élément du corrigé dans le livret étudiant', async () => {
    const reponse = await lire(COURS.slug, FORMATEUR).expect(200);

    expect(clesDuCorrigeDans((reponse.body as Livret).sujet)).toEqual([]);
  });

  it('laisse un administrateur lire le livret', async () => {
    const reponse = await lire(COURS.slug, ADMINISTRATEUR);

    expect(reponse.status).toBe(200);
  });

  it('refuse le livret sans identité puis à un utilisateur qui n est pas formateur', async () => {
    const statuts = [
      (await lire(COURS.slug)).status,
      (await lire(COURS.slug, UTILISATEUR)).status,
    ];

    expect(statuts).toEqual([401, 403]);
  });

  it('rend 404 pour un cours absent du catalogue', async () => {
    const reponse = await lire('cours-inconnu', FORMATEUR);

    expect(reponse.status).toBe(404);
  });

  it('documente exactement la forme rendue', async () => {
    const reponse = await lire(COURS.slug, FORMATEUR).expect(200);

    expect(
      ecartsAuSchemaDeLaRoute(app(), '/livrets/{slug}', reponse.body),
    ).toEqual([]);
  });
});
