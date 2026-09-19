import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import {
  buildCoursStockeV3,
  buildEcranStockeV3,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { lireCoursStocke } from './CoursStocke';
import { ecranVerrouille, projeterCatalogue } from './Diffusion';
import { tirer } from './Tirage';

describe('ecranVerrouille', () => {
  it('ne garde que l identifiant, le titre et la durée', () => {
    const [ecran] = tirer(buildCoursDeTest(), 3).sujet.ecrans;

    expect(ecranVerrouille({ ...ecran, titre: 'Rappel' })).toEqual({
      id: ecran.id,
      type: 'ecran-verrouille',
      titre: 'Rappel',
      duree: ecran.duree,
      interactif: false,
      donnees: {},
    });
  });
});

describe('projeterCatalogue (B19)', () => {
  it('sert en clair les écrans du catalogue et verrouille les écrans de séance', () => {
    const cours = lireCoursStocke(
      buildCoursStockeV3([
        buildEcranStockeV3('fp-quote', { diffusion: 'catalogue' }),
        buildEcranStockeV3('fp-recall'),
      ]),
    );
    const sujet = tirer(cours, 0).sujet;

    expect(projeterCatalogue(cours)).toEqual({
      ...sujet,
      ecrans: [sujet.ecrans[0], ecranVerrouille(sujet.ecrans[1])],
    });
  });

  it('sert en clair toute version historique, lue en diffusion catalogue', () => {
    const cours = buildCoursDeTest();

    expect(projeterCatalogue(cours)).toEqual(tirer(cours, 0).sujet);
  });
});
