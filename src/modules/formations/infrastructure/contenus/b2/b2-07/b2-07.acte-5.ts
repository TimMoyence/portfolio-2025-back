import * as moteur from '../../briques';
import {
  BORNES_OUBLIEES,
  CONCEPTS_DE_LA_DERIVEE,
  CONDITION_INVERSEE,
  CONSTANTE,
  EXPOSANT,
  K_POUR_TAUX,
  LUE_COMME_PRODUIT,
  SANS_CHANGEMENT_DE_SIGNE,
  SANS_K,
  SEUIL_MAL_ARRONDI,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_F,
  VALEUR_POUR_PENTE,
} from './b2-07.donnees';

export const ACTE_5: moteur.Acte = [
  moteur.ecranDeRappel(
    {
      screenId: 'B2-07-A5-01-RAPPEL',
      concepts: [
        ...CONCEPTS_DE_LA_DERIVEE,
        'fonction-exponentielle',
        'logarithme-neperien',
        'resolution-par-logarithme',
        'algorithme-de-seuil',
        'prevision',
      ],
    },
    'Tous reçoivent les deux questions obligatoires (dérivée de e^(kx), extremum et changement de signe), en plus de leurs points faibles.',
    'b2-07-a5-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-07-r-zero',
          'fonction-exponentielle',
          'Que vaut e⁰ ?',
          '1, comme toute puissance d’exposant nul',
          [['0, puisque l’exposant est nul', LUE_COMME_PRODUIT]],
        ),
        moteur.rappel(
          'b2-07-r-taux',
          'fonction-exponentielle',
          'Un modèle s’écrit a e^(0,05x). Quel est son taux d’évolution par unité ?',
          'e^0,05 − 1, soit environ 5,13 %',
          [['Exactement 5 %, la valeur de k', K_POUR_TAUX]],
        ),
        moteur.rappel(
          'b2-07-r-equation',
          'logarithme-neperien',
          'Quelle est la solution de eˣ = 4 ?',
          'x = ln 4, soit environ 1,39',
          [['x = 4 ÷ e, soit environ 1,47', SEUIL_PAR_DIVISION]],
        ),
        moteur.rappel(
          'b2-07-r-condition',
          'algorithme-de-seuil',
          'Une boucle cherche le premier rang où u dépasse 800. Quelle condition écrire après « Tant que » ?',
          'u ≤ 800 : la boucle tourne tant que l’objectif n’est pas atteint',
          [['u > 800 : c’est l’objectif à atteindre', CONDITION_INVERSEE]],
        ),
        moteur.rappel(
          'b2-07-r-entier',
          'prevision',
          'Une résolution donne n ≥ 9,3. Quel est le premier entier solution ?',
          'Dix, l’entier juste au-dessus',
          [['Neuf, l’entier juste en dessous', SEUIL_MAL_ARRONDI]],
        ),
        moteur.rappel(
          'b2-07-r-carre',
          'fonction-derivee',
          'Quelle est la dérivée de 5x² ?',
          '10x : l’exposant descend devant et perd un',
          [['5x : on a seulement enlevé le carré', EXPOSANT]],
        ),
        moteur.rappel(
          'b2-07-r-constante',
          'fonction-derivee',
          'Quelle est la dérivée de 3x + 700 ?',
          '3 : la dérivée d’un nombre seul vaut 0',
          [['3 + 700 : chaque terme se garde', CONSTANTE]],
        ),
        moteur.rappel(
          'b2-07-r-exponentielle',
          'fonction-derivee',
          'Quelle est la dérivée de e^(0,5x) ?',
          '0,5e^(0,5x) : on multiplie par k',
          [['e^(0,5x) : l’exponentielle reste la même', SANS_K]],
        ),
        moteur.rappel(
          'b2-07-r-pente',
          'fonction-derivee',
          'Que donne f′(4) ?',
          'La pente de la courbe de f au point d’abscisse 4',
          [['La valeur de f quand x vaut 4', VALEUR_POUR_PENTE]],
        ),
        moteur.rappel(
          'b2-07-r-signe',
          'variations-d-une-fonction',
          'Sur [0 ; 5], f′(x) est négatif. Que peut-on dire de f ?',
          'f est décroissante sur [0 ; 5]',
          [['f est négative sur [0 ; 5]', SIGNE_DE_F]],
        ),
        moteur.rappel(
          'b2-07-r-extremum',
          'optimisation',
          'f′(3) = 0. Quand f admet-elle un maximum en 3 ?',
          'Quand f′ passe de + à − en 3',
          [['Toujours : f′(3) = 0 suffit', SANS_CHANGEMENT_DE_SIGNE]],
        ),
        moteur.rappel(
          'b2-07-r-bord',
          'optimisation',
          'f croît sur tout l’intervalle [2 ; 9]. Où est son maximum ?',
          'En x = 9, la borne de droite',
          [['Là où f′ s’annule, sinon nulle part', BORNES_OUBLIEES]],
        ),
      ],
      obligatoires: ['b2-07-r-exponentielle', 'b2-07-r-extremum'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-07-A5-02-FICHE-MEMO',
      titre: 'Fiche mémo : dérivée et optimisation',
      concepts: [...CONCEPTS_DE_LA_DERIVEE],
    },
    [
      {
        title: 'Nombre dérivé',
        description: 'Que mesure f′(a) ?',
        back: 'La pente de la courbe de f au point d’abscisse a : f′(a) > 0 ça monte, f′(a) < 0 ça descend, f′(a) = 0 c’est plat.',
      },
      {
        title: 'Recettes de dérivation',
        description: 'Comment dériver ?',
        back: '(k)′ = 0 ; (x)′ = 1 ; (x²)′ = 2x ; (x³)′ = 3x² ; (k × u)′ = k × u′ ; (u + v)′ = u′ + v′.',
      },
      {
        title: 'Exponentielle',
        description: 'Que vaut (a e^(kx))′ ?',
        back: 'a k e^(kx). Comme e^(kx) > 0, son signe est celui de a × k.',
      },
      {
        title: 'Signe et sens',
        description: 'Que dit le signe de f′ ?',
        back: 'f′ > 0 sur I : f croissante. f′ < 0 sur I : f décroissante. Le signe de f ne dit rien de son sens.',
      },
      {
        title: 'Tableau de variation',
        description: 'Que contient-il ?',
        back: 'Ligne x, ligne du signe de f′, ligne des flèches avec les valeurs de f aux bornes et aux changements de sens.',
      },
      {
        title: 'Extremum',
        description: 'Quand f a-t-elle un maximum en a ?',
        back: 'Quand f′ s’annule en a en passant de + à −. De − à + : un minimum. Sans changement de signe : pas d’extremum.',
      },
      {
        title: 'Optimum sur un intervalle',
        description: 'Où chercher le meilleur ?',
        back: 'Comparer les valeurs aux bornes et aux extremums. Sous contrainte, l’optimum peut être une borne.',
      },
      {
        title: 'Rédiger au CCF',
        description: 'Quelles quatre étapes ?',
        back: '1. Calculer f′(x). 2. Résoudre f′(x) = 0. 3. Étudier le signe de f′(x). 4. Dresser le tableau de variation et conclure par le x et la valeur.',
      },
      {
        title: 'Tableur',
        description: 'Comment écrire un carré ?',
        back: 'Avec ^ : =3*A2^2-5*A2+7 calcule 3x² − 5x + 7 pour x en A2, puis se recopie vers le bas. La colonne de la dérivée change de signe au sommet.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
