import {
  buildContenuAvecSolution,
  buildCoursAvecExplicationAllongee,
  buildCoursDuContenu,
} from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { valeursDevoileesAvantLeurEcran } from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import type { Cours } from '../../../../domain/contrats/cours';
import { COURS_B2_09 } from './b2-09.cours';

const alertesApres = (cours: Cours, ajout: string): string =>
  valeursDevoileesAvantLeurEcran(
    buildCoursAvecExplicationAllongee(cours, 'b2-09-a2-chemin', ajout),
  ).join(' | ');

describe('B2-09 — corrections sur place', () => {
  it.each([
    ['P(R) vaudra 0,083.', '0,083 de B2-09-A4-08-ATELIER-SYNTHESE'],
    ['P(D) vaudra 0,055.', '0,055 de B2-09-A3-05-ATELIER-TOTALES'],
    ['P(D) vaudra 5,5 %.', '5,5 % de B2-09-A3-05-ATELIER-TOTALES'],
    ['P(D) vaudra 5,5% collé.', '5,5% de B2-09-A3-05-ATELIER-TOTALES'],
    ['P(D) vaudra 5,50 %.', '5,50 % de B2-09-A3-05-ATELIER-TOTALES'],
    ['Environ 49 % des voiles.', '49 % de B2-09-A3-09-ATELIER-REMONTER'],
    ['Environ 8 % des paiements.', '8 % de B2-09-A4-08-ATELIER-SYNTHESE'],
    ['P(D) ≈ 6 %.', '6 % de B2-09-A3-05-ATELIER-TOTALES'],
    ['P(D) ≈ 6,00 %.', '6,00 % de B2-09-A3-05-ATELIER-TOTALES'],
  ])(
    'GR-M3 · voit dans une correction antérieure une réponse écrite exactement ou en pourcentage : « %s »',
    (ajout, alerte) => {
      expect(alertesApres(buildCoursDuContenu(COURS_B2_09), ajout)).toContain(
        `${alerte} dans B2-09-A2-07-ATELIER-ARBRE`,
      );
    },
  );
});

describe('GR-M3 — une réponse négative en part', () => {
  const COURS_A_REPONSE_NEGATIVE = buildCoursDuContenu(
    buildContenuAvecSolution(COURS_B2_09, 'b2-09-a3-defaut', -0.055, '−0,055'),
  );

  it.each([
    ['Le taux baissera de 5,5 %.', '5,5 % de B2-09-A3-05-ATELIER-TOTALES'],
    ['Le taux vaudra −5,5 %.', '-5,5 % de B2-09-A3-05-ATELIER-TOTALES'],
    [
      'Le taux vaudra 0,055 en valeur absolue.',
      '0,055 de B2-09-A3-05-ATELIER-TOTALES',
    ],
  ])(
    'PCT-02 · voit dans une correction antérieure la réponse −0,055 écrite avec ou sans son signe, en part ou en pourcentage : « %s »',
    (ajout, alerte) => {
      expect(alertesApres(COURS_A_REPONSE_NEGATIVE, ajout)).toContain(
        `${alerte} dans B2-09-A2-07-ATELIER-ARBRE`,
      );
    },
  );
});
