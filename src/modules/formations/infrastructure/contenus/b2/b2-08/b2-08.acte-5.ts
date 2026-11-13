import * as moteur from '../../briques';
import {
  CONCEPTS_DU_COURS,
  MAL_ENCADRE,
  MAUVAISE_MOITIE,
  MOYEN_POUR_MARGINAL,
  PRODUIT_TERME_A_TERME,
  QUOTIENT_INVERSE,
  QUOTIENT_SANS_CARRE,
  RECETTE_SANS_PRIX,
  SANS_U_PRIME,
  SANS_VARIATIONS,
  SEUIL_PAR_DIVISION,
} from './b2-08.donnees';

export const ACTE_5: moteur.Acte = [
  moteur.ecranDeRappel(
    {
      screenId: 'B2-08-A5-01-RAPPEL',
      concepts: [
        'derivees-composees',
        'fonctions-economiques',
        'resolution-approchee',
        'resolution-par-logarithme',
      ],
    },
    'Tous reçoivent les deux questions obligatoires (dérivée d’un produit, nombre de solutions de f(x) = k), en plus de leurs points faibles.',
    'b2-08-a5-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-08-r-produit',
          'derivees-composees',
          'Quelle est la dérivée de u × v ?',
          'u′v + uv′ : on dérive l’un en gardant l’autre, puis l’inverse',
          [['u′ × v′ : le produit des dérivées', PRODUIT_TERME_A_TERME]],
        ),
        moteur.rappel(
          'b2-08-r-quotient',
          'derivees-composees',
          'Quel est le numérateur de la dérivée de u/v ?',
          'u′v − uv′, en commençant par la dérivée du haut',
          [['uv′ − u′v', QUOTIENT_INVERSE]],
        ),
        moteur.rappel(
          'b2-08-r-quotient-carre',
          'derivees-composees',
          'Quel est le dénominateur de la dérivée de u/v ?',
          'v², le dénominateur au carré',
          [['v, le dénominateur tel quel', QUOTIENT_SANS_CARRE]],
        ),
        moteur.rappel(
          'b2-08-r-exp-u',
          'derivees-composees',
          'Quelle est la dérivée de e^(3x²) ?',
          '6x e^(3x²) : on multiplie par u′ = 6x',
          [['e^(3x²) : l’exponentielle reste la même', SANS_U_PRIME]],
        ),
        moteur.rappel(
          'b2-08-r-ln-u',
          'derivees-composees',
          'Quelle est la dérivée de ln(5x + 1), pour x ≥ 0 ?',
          '5/(5x + 1) : u′ sur u',
          [['1/(5x + 1) : un sur u', SANS_U_PRIME]],
        ),
        moteur.rappel(
          'b2-08-r-marginal',
          'fonctions-economiques',
          'C(q) est le coût total de q unités. Comment approcher le coût d’une unité de plus ?',
          'Par C′(q), le coût marginal',
          [['Par C(q) ÷ q, le coût moyen', MOYEN_POUR_MARGINAL]],
        ),
        moteur.rappel(
          'b2-08-r-moyen-minimal',
          'fonctions-economiques',
          'Où le coût moyen est-il minimal ?',
          'Là où il égale le coût marginal, CM(q) = C′(q)',
          [['Là où le coût marginal est minimal', MOYEN_POUR_MARGINAL]],
        ),
        moteur.rappel(
          'b2-08-r-recette',
          'fonctions-economiques',
          'Au prix p, on vend D(p) articles. Que vaut la recette ?',
          'Le prix fois la quantité vendue',
          [['La quantité vendue seule', RECETTE_SANS_PRIX]],
        ),
        moteur.rappel(
          'b2-08-r-equilibre',
          'resolution-par-logarithme',
          'L’équilibre du marché revient à e^(0,05p) = 3. Que vaut p ?',
          'p = ln 3 ÷ 0,05',
          [['p = 3 ÷ 0,05 = 60', SEUIL_PAR_DIVISION]],
        ),
        moteur.rappel(
          'b2-08-r-solutions',
          'resolution-approchee',
          'f est strictement croissante sur [a ; b] et k est entre f(a) et f(b). Combien de solutions a f(x) = k sur [a ; b] ?',
          'Une solution, pas davantage',
          [['On ne peut pas savoir sans tracer la courbe', SANS_VARIATIONS]],
        ),
        moteur.rappel(
          'b2-08-r-balayage',
          'resolution-approchee',
          'f est croissante, f(3,4) < k < f(3,5). Quelle est la valeur approchée par défaut, au dixième, de la solution ?',
          '3,4, la borne de gauche',
          [['3,5, la borne de droite', MAL_ENCADRE]],
        ),
        moteur.rappel(
          'b2-08-r-dichotomie',
          'resolution-approchee',
          'Dichotomie sur [a ; b] de milieu m, f croissante : f(m) est au-dessus de k. Quelle moitié garder ?',
          '[a ; m], où f(x) − k change de signe',
          [['[m ; b], la moitié qui suit', MAUVAISE_MOITIE]],
        ),
      ],
      obligatoires: ['b2-08-r-produit', 'b2-08-r-solutions'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-08-A5-02-FICHE-MEMO',
      titre: 'Fiche mémo : dérivées composées et fonctions économiques',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Produit',
        description: 'Que vaut (uv)′ ?',
        back: 'u′v + uv′. Écrire u, v, u′, v′ sur quatre lignes, puis remplacer. Jamais u′ × v′.',
      },
      {
        title: 'Quotient',
        description: 'Que vaut (u/v)′ ?',
        back: '(u′v − uv′)/v², avec v qui ne s’annule pas. Le numérateur commence par la dérivée du haut.',
      },
      {
        title: 'e^u et ln u',
        description: 'Que valent (e^u)′ et (ln u)′ ?',
        back: '(e^u)′ = u′e^u, du signe de u′ ; (ln u)′ = u′/u, pour u > 0. Ne pas oublier u′.',
      },
      {
        title: 'Calcul formel',
        description: 'Que faire d’une sortie de logiciel ?',
        back: 'La lire, puis la vérifier à la main en une valeur simple, souvent x = 0, avant de l’utiliser.',
      },
      {
        title: 'Trois coûts',
        description: 'Total, moyen, marginal ?',
        back: 'C(q) pour q unités ; CM(q) = C(q) ÷ q ; Cm(q) ≈ C′(q), le coût d’une unité de plus. Le coût moyen est minimal là où CM = Cm.',
      },
      {
        title: 'Marché',
        description: 'Recette et prix d’équilibre ?',
        back: 'R(p) = p × D(p), un produit à dériver. Le prix d’équilibre résout D(p) = O(p) : regrouper les exponentielles, puis passer par ln.',
      },
      {
        title: 'Nombre de solutions',
        description: 'Quand f(x) = k a-t-elle une seule solution ?',
        back: 'Quand f est continue et strictement monotone sur [a ; b] et que k est entre f(a) et f(b). Se lit dans le tableau de variation.',
      },
      {
        title: 'Balayage et dichotomie',
        description: 'Comment encadrer la solution ?',
        back: 'Balayage : pas de 1, puis de 0,1, entre les deux valeurs qui encadrent k. Dichotomie : couper au milieu, garder la moitié où f(x) − k change de signe.',
      },
      {
        title: 'Tableur',
        description: 'Comment écrire 1 000/(1 + 9e^(−0,3t)) ?',
        back: '=1000/(1+9*EXP(-0,3*A2)) : EXP pour l’exponentielle, le signe moins dans l’exposant, des parenthèses autour du dénominateur.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
