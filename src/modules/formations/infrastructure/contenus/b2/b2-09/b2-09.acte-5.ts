import * as moteur from '../../briques';
import {
  BRANCHES_ADDITIONNEES,
  COMPLEMENT,
  CONCEPTS_DU_COURS,
  INCOMPATIBILITE,
  INCOMPLETES,
  INTERSECTION,
  INVERSEE,
  MAUVAIS_TOTAL,
  REUNION,
  SANS_CALCUL,
  SANS_PONDERATION,
} from './b2-09.donnees';

export const ACTE_5: moteur.Acte = [
  moteur.ecranDeRappel(
    {
      screenId: 'B2-09-A5-01-RAPPEL',
      concepts: [...CONCEPTS_DU_COURS],
    },
    'Tous reçoivent les deux questions obligatoires (lire P_A(B), pondérer les probabilités totales), en plus de leurs points faibles.',
    'b2-09-a5-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-09-r-contraire',
          'probabilite-d-un-evenement',
          'P(A) = 0,15. Comment obtenir P(Ā) ?',
          'En retirant P(A) de 1',
          [['En reprenant P(A), au signe près', COMPLEMENT]],
        ),
        moteur.rappel(
          'b2-09-r-reunion',
          'probabilite-d-un-evenement',
          'Que vaut P(A ∪ B) ?',
          'P(A) plus P(B), moins la part commune P(A ∩ B)',
          [['P(A) plus P(B), sans rien retirer', REUNION]],
        ),
        moteur.rappel(
          'b2-09-r-chemin',
          'probabilite-conditionnelle',
          'Sur un arbre, comment obtenir la probabilité d’un chemin ?',
          'On multiplie les probabilités de ses branches',
          [
            [
              'On additionne les probabilités de ses branches',
              BRANCHES_ADDITIONNEES,
            ],
          ],
        ),
        moteur.rappel(
          'b2-09-r-noeud',
          'probabilite-d-un-evenement',
          'Un nœud porte deux branches ; l’une vaut 0,15. Que vaut l’autre ?',
          'Le complément à 1 de la première',
          [['La probabilité d’une branche d’un autre nœud', COMPLEMENT]],
        ),
        moteur.rappel(
          'b2-09-r-conditionnelle',
          'probabilite-conditionnelle',
          'Sur la branche qui va de A vers B, quelle probabilité lit-on ?',
          'La probabilité de B sachant A, P_A(B)',
          [['La probabilité de A et B à la fois, P(A ∩ B)', INTERSECTION]],
        ),
        moteur.rappel(
          'b2-09-r-tableau',
          'probabilite-conditionnelle',
          'Dans un tableau croisé, par quoi divise-t-on pour obtenir P_A(B) ?',
          'Par l’effectif de la ligne A',
          [['Par l’effectif total du tableau', MAUVAIS_TOTAL]],
        ),
        moteur.rappel(
          'b2-09-r-sens',
          'probabilite-conditionnelle',
          '« Parmi les clients qui achètent, la part venue de la lettre. » Quelle probabilité est-ce ?',
          'P_achat(lettre) : la condition est l’achat',
          [['P_lettre(achat) : la condition est la lettre', INVERSEE]],
        ),
        moteur.rappel(
          'b2-09-r-partition',
          'probabilites-totales',
          'Combien de chemins somme-t-on pour obtenir P(B) sur un arbre à deux branches A et Ā ?',
          'Les deux chemins qui finissent par B',
          [['Le seul chemin qui passe par A', INCOMPLETES]],
        ),
        moteur.rappel(
          'b2-09-r-ponderation',
          'probabilites-totales',
          'P(B) par les probabilités totales sur la partition A, Ā ?',
          'P(A) × P_A(B) + P(Ā) × P_Ā(B), chaque chemin multiplié',
          [['P_A(B) + P_Ā(B), sans les pondérer', SANS_PONDERATION]],
        ),
        moteur.rappel(
          'b2-09-r-remonter',
          'probabilite-conditionnelle',
          'Comment obtenir P_B(A) à partir de l’arbre de A puis B ?',
          'Le chemin A puis B, divisé par P(B)',
          [['On lit P_A(B) sur la branche', INVERSEE]],
        ),
        moteur.rappel(
          'b2-09-r-independance',
          'independance',
          'Comment justifier que A et B sont indépendants ?',
          'En vérifiant que P(A ∩ B) égale P(A) × P(B)',
          [
            [
              'En vérifiant que A et B ne peuvent pas arriver ensemble',
              INCOMPATIBILITE,
            ],
          ],
        ),
        moteur.rappel(
          'b2-09-r-independance-arbre',
          'independance',
          'Sur un arbre, P_A(B) = P_Ā(B). Que peut-on dire de A et B ?',
          'Ils sont indépendants : B ne dépend pas de A',
          [['Rien, sans un tableau des effectifs', SANS_CALCUL]],
        ),
      ],
      obligatoires: ['b2-09-r-conditionnelle', 'b2-09-r-ponderation'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-09-A5-02-FICHE-MEMO',
      titre: 'Fiche mémo : probabilités conditionnelles',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Contraire et réunion',
        description: 'Que valent P(Ā) et P(A ∪ B) ?',
        back: 'P(Ā) = 1 − P(A). P(A ∪ B) = P(A) + P(B) − P(A ∩ B) : la part commune ne se compte qu’une fois.',
      },
      {
        title: 'Arbre pondéré',
        description: 'Que porte une branche ?',
        back: 'La première génération porte P(A) ; la seconde porte P_A(B). Les branches d’un même nœud somment à 1.',
      },
      {
        title: 'Un chemin',
        description: 'Que vaut P(A ∩ B) ?',
        back: 'P(A) × P_A(B) : on multiplie le long du chemin. On n’additionne jamais le long d’un chemin.',
      },
      {
        title: 'Tableau croisé',
        description: 'Comment lire P_A(B) ?',
        back: 'Effectif de A ∩ B ÷ effectif de A : on divise par la ligne de la condition, pas par le total.',
      },
      {
        title: 'Sachant',
        description: 'Laquelle est la condition ?',
        back: 'Dans P_A(B), A est la condition : « parmi les A, la part des B ». P_A(B) et P_B(A) sont deux nombres différents.',
      },
      {
        title: 'Probabilités totales',
        description: 'Comment obtenir P(B) ?',
        back: 'Sur une partition A, Ā : P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B). On somme tous les chemins qui mènent à B.',
      },
      {
        title: 'Remonter l’arbre',
        description: 'Comment obtenir P_B(A) ?',
        back: 'P_B(A) = P(A ∩ B) ÷ P(B) : le chemin, divisé par la probabilité totale de B.',
      },
      {
        title: 'Indépendance',
        description: 'Comment la justifier ?',
        back: 'A et B sont indépendants si P(A ∩ B) = P(A) × P(B), ou si P_A(B) = P(B). Indépendants n’est pas incompatibles.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
