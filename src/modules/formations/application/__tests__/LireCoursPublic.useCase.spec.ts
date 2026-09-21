import {
  buildCoursDeClasse,
  buildCoursDeTest,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import { buildCoursStocke } from '../../../../../test/factories/cours-stocke.factory';
import {
  buildCoursStockeV3,
  buildEcranStockeV3,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { tirer } from '../../domain/cours/Tirage';
import { CoursInconnuError } from '../../domain/errors/FormationErrors';
import { LireCoursPublicUseCase } from '../LireCoursPublic.useCase';

const COURS_STOCKE = lireCoursStocke(buildCoursStocke());
const PROPRIETES_DU_FORMATEUR = [
  '"notes"',
  '"guide"',
  '"correction"',
  '"interaction"',
  '"correctIndex"',
  '"explanation"',
];

describe('LireCoursPublicUseCase', () => {
  it('rend le sujet public du cours, celui du tirage de reference', async () => {
    const sut = new LireCoursPublicUseCase(creerCatalogueDeTest(COURS_STOCKE));

    await expect(sut.execute(COURS_STOCKE.slug)).resolves.toEqual({
      ...tirer(COURS_STOCKE, 0).sujet,
      version: 1,
      publieLe: expect.any(String),
    });
  });

  it('sert la version publiee et sa date de bascule (H1)', async () => {
    const initiale = buildCoursDeTest();
    const suivante = { ...buildCoursDeClasse(2), slug: initiale.slug };
    const catalogue = creerCatalogueAVersions(
      { [initiale.slug]: { 1: initiale, 2: suivante } },
      { [initiale.slug]: 1 },
    );
    const sut = new LireCoursPublicUseCase(catalogue);

    const servi = await sut.execute(initiale.slug);

    expect(servi.version).toBe(1);
    expect(Date.parse(servi.publieLe)).not.toBeNaN();
  });

  it('ne livre ni notes, ni guide, ni correction, ni quiz note', async () => {
    const sut = new LireCoursPublicUseCase(creerCatalogueDeTest(COURS_STOCKE));

    const contenu = JSON.stringify(await sut.execute(COURS_STOCKE.slug));

    expect(
      PROPRIETES_DU_FORMATEUR.filter((cle) => contenu.includes(cle)),
    ).toEqual([]);
  });

  it('lit la derniere version publiee du cours', async () => {
    const initiale = buildCoursDeTest();
    const publiee = { ...buildCoursDeClasse(2), slug: initiale.slug };
    const sut = new LireCoursPublicUseCase(
      creerCatalogueAVersions({ [initiale.slug]: { 1: initiale, 2: publiee } }),
    );

    await expect(sut.execute(initiale.slug)).resolves.toEqual({
      ...tirer(publiee, 0).sujet,
      version: 2,
      publieLe: expect.any(String),
    });
  });

  it('verrouille au catalogue les écrans réservés à la séance (B19)', async () => {
    const v3 = lireCoursStocke(
      buildCoursStockeV3([
        buildEcranStockeV3('fp-quote', { diffusion: 'catalogue' }),
        buildEcranStockeV3('fp-cardsort'),
      ]),
    );
    const sut = new LireCoursPublicUseCase(creerCatalogueDeTest(v3));

    const { ecrans } = await sut.execute(v3.slug);

    expect(ecrans[0].type).toBe('fp-quote');
    expect(ecrans[1]).toEqual({
      id: 'B2-01-A1-01-FP-CARDSORT',
      type: 'ecran-verrouille',
      titre: 'Écran fp-cardsort',
      duree: 8,
      interactif: false,
      donnees: {},
    });
  });

  it('refuse un cours absent du catalogue', async () => {
    const sut = new LireCoursPublicUseCase(creerCatalogueDeTest());

    await expect(sut.execute('cours-inconnu')).rejects.toBeInstanceOf(
      CoursInconnuError,
    );
  });
});
