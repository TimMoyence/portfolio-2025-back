import * as moteur from './briques';
import {
  AJUSTEMENT_DE_Y,
  ATTENDUS_DES_KITS,
  CONCEPTS_DE_L_EXPONENTIELLE,
  DONNEES_FICTIVES,
  FORMULE_DE_LA_PENTE,
  FORMULE_DE_LA_PREVISION,
  FORMULE_DE_L_ORDONNEE,
  FORMULE_DU_COEFFICIENT,
  FORMULE_DU_LOGARITHME,
  K_POUR_TAUX,
  LN_EN_PRODUIT,
  LUE_COMME_PRODUIT,
  ORDONNEE_NON_EXPONENTIEE,
  PARCOURS_DU_COFFRE,
  PLAN_DES_KITS,
  RENVOI_AUX_KITS,
  SENS_INCHANGE,
  SEUIL_MAL_ARRONDI,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_K,
  TAUX_POUR_COEFFICIENT,
  TOUCHE_LOG,
} from './b2-06.donnees';

export const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_AUX_KITS,
      titre: 'Mini-situation CCF : les kits de réparation',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: [
        'ajustement-exponentiel',
        'resolution-par-logarithme',
        'prevision',
      ],
      notes: moteur.puces(
        'Mini-situation de 33 min (tableur 16, coffre 14, lecture 3), calculatrice, poste individuel ; barème sur 10 : tableur 3, énigmes 2, 2, 1,5 et 1,5.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : les kits de réparation',
      subtitle:
        'Le dossier des kits de réparation de voile d’Atelier Rivage. Barème sur 10 : une question tableur, puis quatre énigmes.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Contexte',
          contenu:
            'Atelier Rivage vend aux clubs nautiques un kit de réparation de voile. Hélène Garnier doit en fixer le prix.',
        },
        {
          rubrique: 'Étude de prix',
          contenu:
            'Six prix testés, de 10 € à 35 € le kit. Le prix x est exprimé en dizaines d’euros (x = 1 pour 10 €, x = 3,5 pour 35 €) et la demande mensuelle y en centaines de kits.',
        },
        {
          rubrique: 'Relevés',
          contenu:
            'Demande y pour x = 1 ; 1,5 ; 2 ; 2,5 ; 3 ; 3,5 : 9,9 ; 7 ; 4,9 ; 3,5 ; 2,4 et 1,7 centaines de kits.',
        },
        {
          rubrique: 'Modèle retenu',
          contenu:
            'Après ajustement par z = ln y, le cabinet retient f(x) = 20e^(−0,7x), demande mensuelle en centaines de kits au prix de x dizaines d’euros.',
        },
        moteur.BAREME_DE_LA_MINI_SITUATION,
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A4-02-TABLEUR-KITS',
      titre: 'Question tableur (3 points sur 10) : ajuster la demande',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 14,
      concepts: ['tableur', 'ajustement-exponentiel', 'prevision'],
      notes: moteur.puces(
        'Temps : réflexion 3 min · travail 11 min',
        'Réflexion : chacun écrit sur papier les étapes de l’ajustement, de z = ln y au coefficient a, puis les formules de la ligne 2.',
        'Erreurs à chercher : PENTE sur la colonne B ; séries de PENTE inversées ; F2 = E2 sans EXP ; EXP(1)*D2*4.',
        'Papier : formules écrites sur la copie, valeurs calculées à la calculatrice ; en CCF, la question se fait devant l’examinateur.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_AUX_KITS,
        plan: PLAN_DES_KITS,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DES_KITS.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DES_KITS,
              attendus: ATTENDUS_DES_KITS,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire D2, puis F2.',
        'Transition : « Avec le modèle retenu, ouvrez le coffre de la mini-situation. »',
      ],
    },
    [
      [
        'C2 à C7',
        `${FORMULE_DU_LOGARITHME}, recopiée : ln 9,9 ≈ 2,293, puis 1,946 ; 1,589 ; 1,253 ; 0,875 et 0,531.`,
      ],
      [
        'D2 et E2',
        `${FORMULE_DE_LA_PENTE} ≈ −0,706 et ${FORMULE_DE_L_ORDONNEE} ≈ 3,003 : les z d’abord, les x ensuite. Sur la colonne B, on ajuste y par une droite, pente −3,21.`,
      ],
      [
        'F2',
        `${FORMULE_DU_COEFFICIENT} ≈ 20,15 : a = e^β. =E2 garde β, l’ordonnée non exponentiée.`,
      ],
      [
        'G2',
        `${FORMULE_DE_LA_PREVISION} ≈ 1,20 centaine, soit environ 120 kits à 40 €. =F2*EXP(1)*D2*4 lit l’exponentielle comme un produit et donne une demande négative.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A4-03-COFFRE-KITS',
      titre: 'Mini-situation : fixer le prix des kits',
      diffusion: 'seance',
      brique: 'fp-escape',
      dureeMinutes: 12,
      concepts: [
        'fonction-exponentielle',
        'resolution-par-logarithme',
        'prevision',
      ],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 10 min',
        'Réflexion : relire le dossier et noter, pour chaque question, s’il faut calculer une valeur de f, résoudre une équation ou une inéquation, ou comparer deux valeurs.',
        'Indices disponibles après 60 s. À 8 min, projeter l’énigme la moins résolue.',
        'Papier : quatre questions rédigées du livret, sans code de coffre.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_AUX_KITS,
        parcours: {
          id: PARCOURS_DU_COFFRE,
          intitule:
            'Fixer le prix des kits : quatre réponses pour ouvrir le coffre',
          delaiIndiceMs: 60000,
          budgetEnigmeMs: 150000,
          tentativesMax: 10,
          enigmes: [
            {
              id: 'b2-06-a4-e1-demande',
              intitule: 'La demande à 25 € (2 points)',
              enonce:
                'Avec f(x) = 20e^(−0,7x), combien de kits les clubs demandent-ils par mois au prix de 25 € ? Arrondir à l’unité.',
              indice:
                'Le prix s’exprime en dizaines d’euros et la demande en centaines de kits : convertissez avant et après le calcul.',
            },
            {
              id: 'b2-06-a4-e2-prix',
              intitule: 'Le prix pour 400 kits (2 points)',
              enonce:
                'Quel prix, en euros arrondis au centime, donne une demande de 400 kits par mois ?',
              indice:
                'Isolez l’exponentielle, appliquez ln, puis divisez par k sans oublier son signe.',
            },
            {
              id: 'b2-06-a4-e3-plancher',
              intitule: 'Le plancher de 200 kits (1,5 point)',
              enonce:
                'À partir de quel prix entier, en euros, la demande passe-t-elle sous 200 kits par mois ?',
              indice:
                'Résolvez l’inéquation avec ln, puis prenez l’entier juste au-dessus.',
            },
            {
              id: 'b2-06-a4-e4-baisse',
              intitule: 'La baisse pour 10 € de plus (1,5 point)',
              enonce:
                'De quel pourcentage la demande baisse-t-elle quand le prix augmente de 10 € ? Arrondir au dixième.',
              indice:
                'Dix euros de plus, c’est une unité de x : le coefficient vaut e^k, le taux de baisse s’en déduit.',
            },
          ],
        },
        questions: [
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            0,
            'b2-06-a4-e1-demande',
            'fonction-exponentielle',
            348,
            0.5,
            '348 kits',
            'S5',
            [
              [99, K_POUR_TAUX],
              [11509, SIGNE_DE_K],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            1,
            'b2-06-a4-e2-prix',
            'resolution-par-logarithme',
            22.99,
            0.01,
            '22,99 euros',
            'L7',
            [
              [-2.86, SEUIL_PAR_DIVISION],
              [-22.99, SIGNE_DE_K],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            2,
            'b2-06-a4-e3-plancher',
            'resolution-par-logarithme',
            33,
            0,
            '33 euros',
            'N2',
            [
              [32, SEUIL_MAL_ARRONDI],
              [20, K_POUR_TAUX],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            3,
            'b2-06-a4-e4-baisse',
            'fonction-exponentielle',
            50.3,
            0.05,
            '50,3 %',
            'E9',
            [
              [70, K_POUR_TAUX],
              [49.7, TAUX_POUR_COEFFICIENT],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Dévoiler énigme par énigme, en s’attardant sur la moins résolue (pupitre).',
        'Finir sur la décision d’Hélène : un prix entre 20 € et 25 € garde la demande au-dessus de 400 kits.',
      ],
    },
    [
      [
        'b2-06-a4-e1-demande',
        '25 € donne x = 2,5 : f(2,5) = 20e^(−1,75) ≈ 3,4755 centaines, soit environ 348 kits. 20 × 0,3^2,5 ≈ 99 kits prend k pour le taux ; e^(+1,75) donnerait 11 509 kits, absurde.',
      ],
      [
        'b2-06-a4-e2-prix',
        '400 kits, c’est y = 4 : e^(−0,7x) = 0,2, donc x = ln 0,2 ÷ (−0,7) ≈ 2,2992, soit 22,99 €. Sans ln, on trouve −2,86 € ; en oubliant le signe de k, −22,99 € : un prix négatif trahit l’erreur.',
      ],
      [
        'b2-06-a4-e3-plancher',
        '20e^(−0,7x) < 2 ⇔ −0,7x < ln 0,1 ⇔ x > ln 0,1 ÷ (−0,7) ≈ 3,2894, soit 32,89 € : premier prix entier 33 €. 32 € arrondit en dessous ; 20 € vient de 0,3ˣ, k pris pour le taux.',
      ],
      [
        'b2-06-a4-e4-baisse',
        'Une unité de x de plus multiplie la demande par e^(−0,7) ≈ 0,4966 : baisse de 1 − 0,4966 ≈ 50,3 %. 70 % prend k pour le taux ; 49,7 % est le coefficient, pas la baisse.',
      ],
    ],
  ),
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
          'Une résolution donne n ≥ 11,53. Quel est le premier entier solution ?',
          'Douze, l’entier juste au-dessus',
          [['Onze, l’entier juste en dessous', SEUIL_MAL_ARRONDI]],
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
        back: 'eˣ = y ⇔ x = ln y, pour y > 0. ln(a × b) = ln a + ln b ; ln(aⁿ) = n × ln a. Touche ln, pas log.',
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
  {
    screenId: 'B2-06-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la formule du seuil',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 4,
    concepts: ['resolution-par-logarithme', 'tableur'],
    notes: moteur.puces(
      '4 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : diviser sans ln, ln d’un quotient, k pris pour le taux.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-06-a4-billet',
          'resolution-par-logarithme',
          true,
          'Hélène place une trésorerie à 3 % par an. Quelle formule de tableur donne le nombre exact d’années pour que le capital double ?',
          '=LN(2)/LN(1,03)',
          [
            ['=2/1,03', SEUIL_PAR_DIVISION],
            ['=LN(2/1,03)', LN_EN_PRODUIT],
            ['=LN(2)/0,03', K_POUR_TAUX],
          ],
        ),
      ],
      invite:
        'En une phrase : pourquoi passe-t-on par ln pour trouver un seuil ?',
    },
  },
];
