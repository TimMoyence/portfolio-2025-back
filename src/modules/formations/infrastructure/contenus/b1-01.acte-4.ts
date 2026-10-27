import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import {
  ADDITIF,
  CONCEPTS_DES_PROPORTIONS,
  FACTEUR_CENT,
  MARQUE_POUR_MARGE,
  MAUVAIS_TOUT,
  MOYENNE_SIMPLE,
  PART_POUR_EVOLUTION,
  POINTS_POUR_POURCENTAGE,
  VALEUR_POUR_TAUX,
} from './b1-01.donnees';
import * as moteur from './briques';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b1-01-r-proportion',
    'proportion',
    'Sur 50 salariés, 15 sont à temps partiel. Quelle part des salariés ?',
    '15 ÷ 50 = 0,3, soit 30 %',
    [['15 %, le nombre de salariés à temps partiel', VALEUR_POUR_TAUX]],
  ),
  moteur.rappel(
    'b1-01-r-partie',
    'proportion',
    '20 % des 150 clients ont un abonnement. Combien de clients ?',
    '30 clients',
    [['20 clients', VALEUR_POUR_TAUX]],
  ),
  moteur.rappel(
    'b1-01-r-decimal',
    'pourcentage',
    'Comment écrire 4 % en nombre décimal ?',
    '0,04, soit 4 ÷ 100',
    [['0,4, soit 4 ÷ 10', FACTEUR_CENT]],
  ),
  moteur.rappel(
    'b1-01-r-tout',
    'proportion',
    '« 30 % des cadres sont des femmes » : quel est le tout ?',
    'Les cadres',
    [['Les femmes', MAUVAIS_TOUT]],
  ),
  moteur.rappel(
    'b1-01-r-parmi',
    'proportion',
    '40 cadres, dont 12 femmes ; 30 femmes en tout dans l’entreprise. Quelle part des cadres sont des femmes ?',
    '12 ÷ 40 = 0,3, soit 30 %',
    [['12 ÷ 30 = 0,4, soit 40 %', MAUVAIS_TOUT]],
  ),
  moteur.rappel(
    'b1-01-r-part-de-part',
    'proportion',
    '50 % des clients ont la carte ; 20 % d’entre eux réservent. Quelle part des clients réserve avec la carte ?',
    '0,5 × 0,2 = 0,1, soit 10 %',
    [['50 % + 20 % = 70 %', ADDITIF]],
  ),
  moteur.rappel(
    'b1-01-r-global',
    'moyenne-ponderee',
    'Groupe A : 10 personnes, 20 % de réussite. Groupe B : 30 personnes, 60 %. Quel est le taux global ?',
    '(2 + 18) ÷ 40 = 0,5, soit 50 %',
    [['(20 % + 60 %) ÷ 2 = 40 %', MOYENNE_SIMPLE]],
  ),
  moteur.rappel(
    'b1-01-r-points',
    'point-de-pourcentage',
    'Un taux passe de 12 % à 15 %. Quel est l’écart ?',
    '+ 3 points',
    [['+ 3 %', POINTS_POUR_POURCENTAGE]],
  ),
  moteur.rappel(
    'b1-01-r-evolution',
    'pourcentage',
    '« Le chiffre d’affaires a augmenté de 8 % » : est-ce une proportion ou une évolution ?',
    'Une évolution',
    [['Une proportion', PART_POUR_EVOLUTION]],
  ),
  moteur.rappel(
    'b1-01-r-marge',
    'pourcentage',
    'Acheté 40 € HT, vendu 50 € HT : quel est le taux de marge ?',
    '10 ÷ 40 = 0,25, soit 25 %',
    [['10 ÷ 50 = 0,2, soit 20 %', MARQUE_POUR_MARGE]],
  ),
  moteur.rappel(
    'b1-01-r-marque',
    'pourcentage',
    'Acheté 40 € HT, vendu 50 € HT : quel est le taux de marque ?',
    '10 ÷ 50 = 0,2, soit 20 %',
    [['10 ÷ 40 = 0,25, soit 25 %', MARQUE_POUR_MARGE]],
  ),
  moteur.rappel(
    'b1-01-r-somme',
    'tableur',
    'Effectifs en D3 à D8 : quelle formule écrire en D9 pour le total ?',
    '=SOMME(D3:D8)',
    [['Le total, tapé au clavier', 'valeur-saisie-sans-formule']],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B1-01-A4-04-RAPPEL',
      concepts: [...CONCEPTS_DES_PROPORTIONS],
    },
    'b1-01-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B1-01-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : proportions et pourcentages',
      concepts: [...CONCEPTS_DES_PROPORTIONS],
    },
    [
      {
        title: 'Proportion',
        description: 'Une part d’un tout ?',
        back: 'p = partie ÷ total. Entre 0 et 1, soit entre 0 % et 100 %.',
      },
      {
        title: 'Partie ou total',
        description: 'Je connais la part ?',
        back: 'partie = p × total ; total = partie ÷ p.',
      },
      {
        title: '% et décimal',
        description: 'Comment l’écrire ?',
        back: '40 % = 0,4 ; 4 % = 0,04. On calcule en décimal.',
      },
      {
        title: 'Population de référence',
        description: '40 % de quoi ?',
        back: 'Le tout qui suit « parmi ». Changer de tout change le pourcentage.',
      },
      {
        title: 'Proportion de proportion',
        description: 'La part d’une part ?',
        back: 'On multiplie : 0,45 × 0,40 = 0,18. Jamais on n’additionne.',
      },
      {
        title: 'Taux global',
        description: 'Plusieurs groupes ?',
        back: 'Concernés ÷ effectif total. Jamais la moyenne simple des taux.',
      },
      {
        title: 'Points de pourcentage',
        description: 'L’écart de deux pourcentages ?',
        back: '24 % − 18 % = 6 points, soit + 33,3 % en évolution.',
      },
      {
        title: 'Marge et marque',
        description: 'Quel taux ?',
        back: 'Marge ÷ coût d’achat HT : taux de marge. Marge ÷ prix de vente HT : taux de marque.',
      },
      {
        title: 'Tableur',
        description: 'La part à recopier ?',
        back: 'Total : =SOMME(B2:B5). Part : =ARRONDI(B2/$B$6*100;1), le total figé par des $.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
