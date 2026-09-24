import {
  buildCorrectionDeReponses,
  buildCorrectionDExemple,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { ecranCorrigePar, sourcesAReveler } from './Corrections';
import { lireCoursStocke } from './CoursStocke';

const QUESTIONNAIRE = buildEcranDeBrique('questionnaire', {
  screenId: 'B2-01-A2-03-ATELIER-1',
});
const EXERCICE = buildEcranDeBrique('fp-worked', {
  screenId: 'B2-01-A2-06-POINTS',
});
const CITATION = buildEcranDeBrique('fp-quote');

const cours = lireCoursStocke(
  buildCoursDeBriques([
    QUESTIONNAIRE,
    buildCorrectionDeReponses(QUESTIONNAIRE.screenId),
    EXERCICE,
    CITATION,
    buildCorrectionDExemple(EXERCICE.screenId),
  ]),
);

describe('écrans de correction', () => {
  it('désigne la source d une correction de réponses et d un exemple corrigé', () => {
    expect(cours.ecrans.map((ecran) => ecranCorrigePar(ecran))).toEqual([
      null,
      'B2-01-A2-03-ATELIER-1',
      null,
      null,
      'B2-01-A2-06-POINTS',
    ]);
  });

  it('SEC-1 · révèle les sources des seules corrections atteintes', () => {
    expect(sourcesAReveler(cours, 0)).toEqual([]);
    expect(sourcesAReveler(cours, 3)).toEqual(['B2-01-A2-03-ATELIER-1']);
    expect(sourcesAReveler(cours, 4)).toEqual([
      'B2-01-A2-03-ATELIER-1',
      'B2-01-A2-06-POINTS',
    ]);
  });
});
