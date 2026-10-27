import * as moteur from './briques';
import {
  AJUSTEMENT_DE_Y,
  CONCEPTS_DE_L_EXPONENTIELLE,
  K_POUR_TAUX,
  LN_EN_PRODUIT,
  LUE_COMME_PRODUIT,
  ORDONNEE_NON_EXPONENTIEE,
  SENS_INCHANGE,
  SEUIL_MAL_ARRONDI,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_K,
  TOUCHE_LOG,
} from './b2-06.donnees';

export const ACTE_4: moteur.Acte = [
  moteur.ecranDeRappel(
    {
      screenId: 'B2-06-A4-04-RAPPEL',
      concepts: [...CONCEPTS_DE_L_EXPONENTIELLE, 'prevision'],
    },
    'Tous reçoivent les deux questions obligatoires (seuil par ln, retour au coefficient a), en plus de leurs points faibles.',
    'b2-06-a4-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-06-r-zero',
          'fonction-exponentielle',
          'Que vaut e⁰ ?',
          '1, comme toute puissance d’exposant nul',
          [['0, puisque l’exposant est nul', LUE_COMME_PRODUIT]],
        ),
        moteur.rappel(
          'b2-06-r-sens',
          'fonction-exponentielle',
          'Comment évolue f(x) = 50e^(−0,2x) quand x augmente ?',
          'Elle décroît, car k = −0,2 est négatif',
          [['Elle croît : une exponentielle croît toujours', SIGNE_DE_K]],
        ),
        moteur.rappel(
          'b2-06-r-taux',
          'fonction-exponentielle',
          'Un modèle s’écrit a e^(0,03x). Quel est son taux d’évolution par unité ?',
          'e^0,03 − 1, soit environ 3,05 %',
          [['Exactement 3 %, la valeur de k', K_POUR_TAUX]],
        ),
        moteur.rappel(
          'b2-06-r-valeur',
          'fonction-exponentielle',
          'Que vaut 400e^(0,1x) pour x = 1 ?',
          'Environ 442,07, soit 400 × e^0,1',
          [['Environ 108,73, soit 400 × e × 0,1', LUE_COMME_PRODUIT]],
        ),
        moteur.rappel(
          'b2-06-r-equation',
          'logarithme-neperien',
          'Quelle est la solution de eˣ = 7 ?',
          'x = ln 7, soit environ 1,95',
          [['x = 7 ÷ e, soit environ 2,58', SEUIL_PAR_DIVISION]],
        ),
        moteur.rappel(
          'b2-06-r-produit',
          'logarithme-neperien',
          'À quoi est égal ln(2 × 5) ?',
          'À ln 2 + ln 5',
          [['À ln 2 × ln 5', LN_EN_PRODUIT]],
        ),
        moteur.rappel(
          'b2-06-r-touche',
          'logarithme-neperien',
          'Quelle touche de la calculatrice donne ln 20 ?',
          'La touche ln, qui affiche environ 2,996',
          [['La touche log, qui affiche environ 1,301', TOUCHE_LOG]],
        ),
        moteur.rappel(
          'b2-06-r-seuil',
          'resolution-par-logarithme',
          'Quelle inégalité donne le premier rang n tel que 1,1ⁿ ≥ 3 ?',
          'n ≥ ln 3 ÷ ln 1,1, soit environ 11,53',
          [['n ≥ 3 ÷ 1,1, soit environ 2,73', SEUIL_PAR_DIVISION]],
        ),
        moteur.rappel(
          'b2-06-r-sens-change',
          'resolution-par-logarithme',
          'Quelle inégalité donne les rangs n tels que 0,9ⁿ ≤ 0,5 ?',
          'n ≥ ln 0,5 ÷ ln 0,9, le sens change',
          [['n ≤ ln 0,5 ÷ ln 0,9, le sens reste', SENS_INCHANGE]],
        ),
        moteur.rappel(
          'b2-06-r-entier',
          'prevision',
          'Une résolution donne n ≥ 7,2. Quel est le premier entier solution ?',
          'Huit, l’entier juste au-dessus',
          [['Sept, l’entier juste en dessous', SEUIL_MAL_ARRONDI]],
        ),
        moteur.rappel(
          'b2-06-r-ajustement',
          'ajustement-exponentiel',
          'Une série perd à peu près la même part à chaque pas. Quelle droite ajuster ?',
          'Celle de z = ln y en x',
          [['Celle de y en x', AJUSTEMENT_DE_Y]],
        ),
        moteur.rappel(
          'b2-06-r-retour',
          'ajustement-exponentiel',
          'L’ajustement donne z = −0,3x + 3. Que vaut a dans le modèle y = a e^(kx) ?',
          'a = e³, soit environ 20,09',
          [['a = 3, l’ordonnée à l’origine', ORDONNEE_NON_EXPONENTIEE]],
        ),
      ],
      obligatoires: ['b2-06-r-seuil', 'b2-06-r-retour'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-06-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : exponentielle et logarithme',
      concepts: [...CONCEPTS_DE_L_EXPONENTIELLE],
    },
    [
      {
        title: 'Fonction exponentielle',
        description: 'Que vaut eˣ ?',
        back: 'e ≈ 2,718. e⁰ = 1, eˣ > 0, e^(a + b) = e^a × e^b. Touche eˣ ; au tableur, EXP.',
      },
      {
        title: 'Modèle a e^(kx)',
        description: 'Que disent a et k ?',
        back: 'a est la valeur en 0. Coefficient par unité e^k, taux e^k − 1, pas k. k > 0 croissante, k < 0 décroissante.',
      },
      {
        title: 'Logarithme népérien',
        description: 'Comment défaire eˣ ?',
        back: 'eˣ = y ⇔ x = ln y, pour y > 0. ln(a × b) = ln a + ln b ; ln(a ÷ b) = ln a − ln b ; ln(aⁿ) = n × ln a. Touche ln, pas log.',
      },
      {
        title: 'Seuil qⁿ ≥ s',
        description: 'À partir de quel rang ?',
        back: 'n × ln q ≥ ln s, puis diviser par ln q. Si 0 < q < 1, ln q < 0 : le sens change.',
      },
      {
        title: 'Équation a e^(kx) = s',
        description: 'Quel x donne s ?',
        back: 'e^(kx) = s ÷ a, puis kx = ln(s ÷ a), puis diviser par k, en surveillant son signe.',
      },
      {
        title: 'Premier entier',
        description: 'Comment arrondir un seuil ?',
        back: 'Toujours l’entier juste au-dessus, puis contrôler les deux rangs voisins.',
      },
      {
        title: 'Reconnaître le modèle',
        description: 'Droite ou exponentielle ?',
        back: 'Écarts constants : affine. Rapports constants : exponentiel. Une droite qui prévoit des valeurs négatives est à rejeter.',
      },
      {
        title: 'Ajustement par z = ln y',
        description: 'Comment ajuster ?',
        back: 'Droite des moindres carrés de z en x : z = αx + β. Puis a = e^β et k = α.',
      },
      {
        title: 'Tableur',
        description: 'Quelles fonctions ?',
        back: 'EXP, LN, PENTE(z ; x), ORDONNEE.ORIGINE(z ; x). Paramètres figés par des $ avant de recopier.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
