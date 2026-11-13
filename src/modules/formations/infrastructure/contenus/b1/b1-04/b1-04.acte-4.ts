import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import { ARRONDI_OUBLIE } from '../b1-01/b1-01.donnees';
import {
  CAUSALITE,
  CONCEPTS_DU_COURS,
  EXTRAPOLATION,
  NON_FIGEE,
  PENTE_INVERSEE,
  POINT_MOYEN_CONFONDU,
  R_POUR_PENTE,
  RANG_POUR_ANNEE,
  SEUIL,
  SIGNE,
} from './b1-04.donnees';
import * as moteur from '../../briques';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b1-04-r-point-moyen',
    'nuage-de-points',
    'x : 2, 4, 6 ; y : 10, 20, 30. Quel est le point moyen G ?',
    'G(4 ; 20), la moyenne des x et la moyenne des y',
    [['G(12 ; 60), les sommes', POINT_MOYEN_CONFONDU]],
  ),
  moteur.rappel(
    'b1-04-r-pente',
    'tableur',
    'Les x sont en B2:B11, les y en C2:C11. Quelle formule donne la pente a ?',
    '=PENTE(C2:C11;B2:B11), la plage des y d’abord',
    [['=PENTE(B2:B11;C2:C11)', PENTE_INVERSEE]],
  ),
  moteur.rappel(
    'b1-04-r-ordonnee',
    'ajustement-affine',
    'Droite y = 1,5x + 40. Que vaut y pour x = 0 ?',
    '40, l’ordonnée à l’origine',
    [['1,5, la pente', PENTE_INVERSEE]],
  ),
  moteur.rappel(
    'b1-04-r-arrondi',
    'tableur',
    'Quelle formule donne la pente arrondie au centième ?',
    '=ARRONDI(PENTE(C2:C11;B2:B11);2)',
    [['=PENTE(C2:C11;B2:B11)', ARRONDI_OUBLIE]],
  ),
  moteur.rappel(
    'b1-04-r-signe',
    'correlation',
    'r = −0,98. L’ajustement affine est-il justifié ?',
    'Oui : r est proche de −1, les points sont presque alignés',
    [['Non : r est négatif', SIGNE]],
  ),
  moteur.rappel(
    'b1-04-r-sens',
    'correlation',
    'Que dit r = 0,8 ?',
    'Les points sont assez bien alignés sur une droite qui monte',
    [['y augmente de 0,8 quand x augmente de 1', R_POUR_PENTE]],
  ),
  moteur.rappel(
    'b1-04-r-comparer',
    'correlation',
    'Deux ajustements : r₁ = 0,62 et r₂ = −0,95. Lequel retenir ?',
    'Le second : |r₂| est plus proche de 1',
    [['Le premier : r₁ est positif', SIGNE]],
  ),
  moteur.rappel(
    'b1-04-r-dollar',
    'tableur',
    'En F2, =COEFFICIENT.CORRELATION(C2:C11;B2:B11), recopiée vers la droite pour la colonne D. Que figer ?',
    'La plage des y : $B$2:$B$11',
    [['Rien : la recopie suit toute seule', NON_FIGEE]],
  ),
  moteur.rappel(
    'b1-04-r-cause',
    'lecture-graphique',
    'Glaces vendues et coups de soleil : r = 0,9. Les glaces causent-elles les coups de soleil ?',
    'Non : le soleil fait monter les deux',
    [['Oui : r est proche de 1', CAUSALITE]],
  ),
  moteur.rappel(
    'b1-04-r-extrapoler',
    'prevision',
    'Les x observés vont de 2 à 10. Que vaut une prévision pour x = 50 ?',
    'Une extrapolation lointaine, à donner avec réserve',
    [['Autant qu’une prévision pour x = 6', EXTRAPOLATION]],
  ),
  moteur.rappel(
    'b1-04-r-rang',
    'prevision',
    'Rang 0 en 2018, y = 3x + 20. Quel x pour prévoir 2026 ?',
    'x = 8, le rang de 2026',
    [['x = 2026', RANG_POUR_ANNEE]],
  ),
  moteur.rappel(
    'b1-04-r-seuil',
    'prevision',
    'y = 2x + 10. À partir de quel rang entier y dépasse-t-il 25 ?',
    '2x + 10 > 25 donne x > 7,5 : rang 8',
    [['Rang 7', SEUIL]],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B1-04-A4-01-RAPPEL',
      concepts: [...CONCEPTS_DU_COURS],
    },
    'b1-04-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B1-04-A4-02-FICHE-MEMO',
      titre: 'Fiche mémo : ajuster et prévoir',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Nuage de points',
        description: 'Deux séries liées ?',
        back: 'Un point (xᵢ ; yᵢ) par individu. Point moyen G(x̄ ; ȳ) : la moyenne des x, la moyenne des y.',
      },
      {
        title: 'Moindres carrés',
        description: 'Quelle droite ?',
        back: 'y = ax + b, la droite qui rend la somme des carrés des écarts verticaux la plus petite. Elle passe par G.',
      },
      {
        title: 'Au tableur',
        description: 'a et b ?',
        back: '=PENTE(plage des y;plage des x) et =ORDONNEE.ORIGINE(plage des y;plage des x), arrondis avec ARRONDI.',
      },
      {
        title: 'Coefficient de corrélation',
        description: 'Points alignés ?',
        back: 'r entre −1 et 1, par COEFFICIENT.CORRELATION. Plus |r| est proche de 1, meilleur est l’ajustement affine.',
      },
      {
        title: 'Comparer deux ajustements',
        description: 'Lequel garder ?',
        back: 'Celui dont |r| est le plus proche de 1, quel que soit le signe de r. r n’est pas la pente.',
      },
      {
        title: 'Liaison ou cause',
        description: 'r proche de 1 ?',
        back: 'Une liaison, pas une preuve de cause : chercher le facteur caché qui fait varier les deux séries.',
      },
      {
        title: 'Interpoler, extrapoler',
        description: 'Prévoir ?',
        back: 'Dans l’intervalle des données : interpoler. Au-delà : extrapoler, avec réserve, d’autant plus qu’on s’éloigne.',
      },
      {
        title: 'Le rang, pas l’année',
        description: 'Quel x ?',
        back: 'x = année − année du rang 0. Remplacer x par l’année donne une prévision absurde.',
      },
      {
        title: 'Atteindre un seuil',
        description: 'À partir de quand ?',
        back: 'Résoudre ax + b > seuil, puis retenir le premier rang entier qui convient.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
