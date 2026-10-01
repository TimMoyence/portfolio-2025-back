import * as moteur from './briques';
import {
  ACTUALISATION_INVERSEE,
  ANNUITE_POUR_AMORTISSEMENT,
  ATTENDUS_DE_LA_CAMIONNETTE,
  CAPITAL_INITIAL,
  CONCEPTS_DES_MATHEMATIQUES_FINANCIERES,
  DONNEES_FICTIVES,
  FORMULE_DE_L_AMORTISSEMENT,
  FORMULE_DE_L_ANNUITE,
  FORMULE_DES_INTERETS,
  FORMULE_DU_CAPITAL_RESTANT,
  FORMULE_DU_COUT,
  FORMULE_DU_REPORT,
  INTERETS_SIMPLES,
  NON_FIGEE,
  PARCOURS_DU_COFFRE,
  PLAN_DE_LA_CAMIONNETTE,
  RENVOI_A_LA_CAMIONNETTE,
  SANS_INTERETS,
  TAUX_POUR_COEFFICIENT,
  TOTAL_REMBOURSE,
  TOUTE_LA_DUREE,
  VPM_NON_SIGNE,
} from './b2-05.donnees';

export const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_A_LA_CAMIONNETTE,
      titre: 'Mini-situation CCF : la camionnette électrique',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['annuites', 'tableau-d-amortissement', 'valeur-actuelle'],
      notes: moteur.puces(
        'Mini-situation de 33 min (tableur 16, coffre 14, lecture 3), calculatrice, poste individuel ; barème sur 10 : tableur 3, énigmes 2, 2, 1,5 et 1,5.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : la camionnette électrique',
      subtitle:
        'Le dossier de la camionnette de livraison d’Atelier Rivage. Barème sur 10 : une question tableur, puis quatre énigmes.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Contexte',
          contenu:
            'Atelier Rivage remplace sa camionnette de livraison par un modèle électrique. Hélène Garnier boucle le financement.',
        },
        {
          rubrique: 'Emprunt',
          contenu:
            '32 000 € empruntés sur 4 ans au taux annuel de 3,5 %, remboursés par annuités constantes a = C × t ÷ (1 − (1 + t)⁻ⁿ).',
        },
        {
          rubrique: 'Placement',
          contenu:
            '15 000 € de trésorerie placés 4 ans à intérêts composés, au taux annuel de 2 %.',
        },
        {
          rubrique: 'Batterie',
          contenu:
            'Une batterie de rechange de 20 000 € sera à payer dans 4 ans ; la somme est placée dès aujourd’hui à 2 % par an.',
        },
        {
          rubrique: 'Épargne',
          contenu:
            '5 000 € versés à la fin de chacune des 4 prochaines années, sur un compte à 2 % par an.',
        },
        moteur.BAREME_DE_LA_MINI_SITUATION,
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A4-02-TABLEUR-CAMIONNETTE',
      titre: 'Question tableur (3 points sur 10) : le tableau d’amortissement',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 14,
      concepts: ['tableur', 'tableau-d-amortissement', 'cout-du-credit'],
      notes: moteur.puces(
        'Temps : réflexion 3 min · travail 11 min',
        'Réflexion : chacun nomme en français les colonnes C, D et E, puis écrit sur papier les formules de la ligne 2.',
        'Erreurs à chercher : VPM sans signe moins ; F2 ou H2 sans $ ; intérêts sur 32 000 € chaque ligne ; I2 = total remboursé.',
        'Papier : formules écrites sur la copie, valeurs calculées à la calculatrice ; en CCF, la question se fait devant l’examinateur.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_A_LA_CAMIONNETTE,
        plan: PLAN_DE_LA_CAMIONNETTE,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DE_LA_CAMIONNETTE.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DE_LA_CAMIONNETTE,
              attendus: ATTENDUS_DE_LA_CAMIONNETTE,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire H2, puis les intérêts de la ligne 2.',
        'Transition : « Avec cette feuille, ouvrez le coffre de la mini-situation. »',
      ],
    },
    [
      [
        'H2',
        `${FORMULE_DE_L_ANNUITE} ≈ 8 712,04 €. Sans le signe moins, l’annuité s’affiche négative ; 32 000 ÷ 4 = 8 000 € oublie les intérêts.`,
      ],
      [
        'C2 à C5',
        `${FORMULE_DES_INTERETS}, recopiée : 1 120 €, puis 854,28 €, 579,26 € et 294,61 €. Sans les $, la recopie lit F3, vide.`,
      ],
      [
        'D2 à D5 et E2 à E5',
        `${FORMULE_DE_L_AMORTISSEMENT} et ${FORMULE_DU_CAPITAL_RESTANT}, recopiées : le capital dû tombe à 0 en fin d’année 4.`,
      ],
      [
        'B3 à B5',
        `${FORMULE_DU_REPORT}, recopiée : le capital dû en début d’année reprend la fin de l’année précédente.`,
      ],
      [
        'I2',
        `${FORMULE_DU_COUT} : le total remboursé moins le capital emprunté. =H2*G2 donne le total remboursé, pas le coût.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A4-03-COFFRE-CAMIONNETTE',
      titre: 'Mini-situation : boucler le financement de la camionnette',
      diffusion: 'seance',
      brique: 'fp-escape',
      dureeMinutes: 12,
      concepts: [
        'interets-composes',
        'valeur-actuelle',
        'annuites',
        'cout-du-credit',
      ],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 10 min',
        'Réflexion : relire le dossier et noter, pour chaque question, s’il faut capitaliser, actualiser, additionner des versements ou lire le tableau.',
        'Indices disponibles après 60 s. À 8 min, projeter l’énigme la moins résolue.',
        'Papier : quatre questions rédigées du livret, sans code de coffre.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_A_LA_CAMIONNETTE,
        parcours: {
          id: PARCOURS_DU_COFFRE,
          intitule:
            'Boucler le financement de la camionnette : quatre réponses pour ouvrir le coffre',
          delaiIndiceMs: 60000,
          budgetEnigmeMs: 150000,
          tentativesMax: 10,
          enigmes: [
            {
              id: 'b2-05-a4-e1-placement',
              intitule: 'Le placement (2 points)',
              enonce:
                'Que vaudra le placement de 15 000 € au bout de 4 ans, en euros, arrondi au centime ?',
              indice:
                'Les intérêts rapportent à leur tour : multipliez par le coefficient autant de fois qu’il y a d’années.',
            },
            {
              id: 'b2-05-a4-e2-batterie',
              intitule: 'La batterie (2 points)',
              enonce:
                'Quelle somme placer aujourd’hui pour payer la batterie de 20 000 € dans 4 ans, en euros, arrondie au centime ?',
              indice: 'On remonte le temps : on divise, on ne multiplie pas.',
            },
            {
              id: 'b2-05-a4-e3-epargne',
              intitule: 'L’épargne (1,5 point)',
              enonce:
                'Quelle épargne sera disponible au quatrième versement de 5 000 €, en euros, arrondie au centime ?',
              indice:
                'Le dernier versement ne rapporte rien : utilisez la formule des suites d’annuités.',
            },
            {
              id: 'b2-05-a4-e4-cout',
              intitule: 'Le coût du crédit (1,5 point)',
              enonce:
                'Quel est le coût du crédit de la camionnette, en euros, arrondi au centime ?',
              indice:
                'Lisez votre feuille : ce que l’on rembourse en plus du capital emprunté.',
            },
          ],
        },
        questions: [
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            0,
            'b2-05-a4-e1-placement',
            'interets-composes',
            16236.48,
            0.01,
            '16 236,48 euros',
            'K4',
            [
              [16200, INTERETS_SIMPLES],
              [16561.21, 'rang-decale'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            1,
            'b2-05-a4-e2-batterie',
            'valeur-actuelle',
            18476.91,
            0.01,
            '18 476,91 euros',
            'V8',
            [
              [21648.64, ACTUALISATION_INVERSEE],
              [18518.52, INTERETS_SIMPLES],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            2,
            'b2-05-a4-e3-epargne',
            'annuites',
            20608.04,
            0.01,
            '20 608,04 euros',
            'M3',
            [
              [20000, SANS_INTERETS],
              [21648.64, TOUTE_LA_DUREE],
              [21020.2, 'rang-decale'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            3,
            'b2-05-a4-e4-cout',
            'cout-du-credit',
            2848.15,
            0.02,
            '2 848,15 euros',
            'T6',
            [
              [34848.15, TOTAL_REMBOURSE],
              [4480, CAPITAL_INITIAL],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Dévoiler énigme par énigme, en s’attardant sur la moins résolue (pupitre).',
        'Finir sur la décision d’Hélène : la camionnette est financée, batterie comprise.',
      ],
    },
    [
      [
        'b2-05-a4-e1-placement',
        '15 000 × 1,02⁴ ≈ 16 236,48 €. Aux intérêts simples : 15 000 × 1,08 = 16 200 € ; avec une année de trop : 16 561,21 €.',
      ],
      [
        'b2-05-a4-e2-batterie',
        '20 000 ÷ 1,02⁴ ≈ 18 476,91 €. Multiplier donne 21 648,64 €, plus que la batterie ; diviser par 1,08 donne 18 518,52 €.',
      ],
      [
        'b2-05-a4-e3-epargne',
        '5 000 × (1,02⁴ − 1) ÷ 0,02 ≈ 20 608,04 €. 20 000 € oublie les intérêts ; 4 × 5 000 × 1,02⁴ ≈ 21 648,64 € place chaque versement quatre ans ; 21 020,20 € place tout un an de trop.',
      ],
      [
        'b2-05-a4-e4-cout',
        '4 × 8 712,036… − 32 000 ≈ 2 848,15 €, la cellule I2 ; avec l’annuité arrondie, 2 848,16 €, accepté. 34 848,15 € est le total remboursé ; 4 × 1 120 = 4 480 € garde les intérêts de la première année.',
      ],
    ],
  ),
  moteur.ecranDeRappel(
    {
      screenId: 'B2-05-A4-04-RAPPEL',
      concepts: [...CONCEPTS_DES_MATHEMATIQUES_FINANCIERES],
    },
    'Tous reçoivent les deux questions obligatoires (valeur actuelle, base des intérêts d’un emprunt), en plus de leurs points faibles.',
    'b2-05-a4-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-05-r-coefficient',
          'interets-composes',
          'Un placement rapporte 4 % par an. Par quel nombre multiplie-t-on le capital chaque année ?',
          'Par 1,04',
          [['Par 0,04', TAUX_POUR_COEFFICIENT]],
        ),
        moteur.rappel(
          'b2-05-r-deux-ans',
          'interets-composes',
          '1 000 € sont placés à 5 % par an, à intérêts composés. Que valent-ils après deux ans ?',
          '1 102,50 €, soit 1 000 × 1,05²',
          [['1 100 €, soit 1 000 + 2 × 50', INTERETS_SIMPLES]],
        ),
        moteur.rappel(
          'b2-05-r-valeur-actuelle',
          'valeur-actuelle',
          'Quelle somme placer aujourd’hui à 10 % par an pour disposer de 1 210 € dans deux ans ?',
          '1 000 €, soit 1 210 ÷ 1,1²',
          [['1 464,10 €, soit 1 210 × 1,1²', ACTUALISATION_INVERSEE]],
        ),
        moteur.rappel(
          'b2-05-r-sens',
          'valeur-actuelle',
          'Pour actualiser une somme disponible dans n années, que fait-on ?',
          'On divise par (1 + t)ⁿ',
          [['On multiplie par (1 + t)ⁿ', ACTUALISATION_INVERSEE]],
        ),
        moteur.rappel(
          'b2-05-r-duree-versement',
          'annuites',
          'Versements en fin d’année, de 2026 à 2030. Combien d’années le versement de fin 2027 rapporte-t-il jusqu’à fin 2030 ?',
          'Trois ans',
          [['Cinq ans : toute la durée du plan', TOUTE_LA_DUREE]],
        ),
        moteur.rappel(
          'b2-05-r-versements',
          'annuites',
          'Trois versements de 1 000 € en fin d’année, à 2 %. L’épargne au troisième versement vaut-elle 3 000 € ?',
          'Non : 3 060,40 €, intérêts compris',
          [['Oui : trois fois 1 000 €', SANS_INTERETS]],
        ),
        moteur.rappel(
          'b2-05-r-interets-emprunt',
          'tableau-d-amortissement',
          'Sur quel capital calcule-t-on les intérêts de la troisième année d’un emprunt ?',
          'Sur le capital restant dû au début de la troisième année',
          [['Sur le capital emprunté au départ', CAPITAL_INITIAL]],
        ),
        moteur.rappel(
          'b2-05-r-amortissement',
          'tableau-d-amortissement',
          'Une annuité de 5 000 € contient 800 € d’intérêts. Quel capital rembourse-t-elle ?',
          '4 200 €',
          [['5 000 €', ANNUITE_POUR_AMORTISSEMENT]],
        ),
        moteur.rappel(
          'b2-05-r-evolution-interets',
          'tableau-d-amortissement',
          'Emprunt à annuités constantes : comment évoluent les intérêts d’une année à l’autre ?',
          'Ils baissent : le capital restant dû diminue',
          [['Ils restent égaux : le taux ne change pas', CAPITAL_INITIAL]],
        ),
        moteur.rappel(
          'b2-05-r-cout',
          'cout-du-credit',
          'Quatre annuités de 2 740 € remboursent un emprunt de 10 000 €. Quel est le coût du crédit ?',
          '960 €',
          [['10 960 €', TOTAL_REMBOURSE]],
        ),
        moteur.rappel(
          'b2-05-r-vpm',
          'tableur',
          'Taux en C1, durée en C2, capital emprunté en C3 : quelle formule affiche une annuité positive ?',
          '=VPM(C1;C2;-C3)',
          [['=VPM(C1;C2;C3)', VPM_NON_SIGNE]],
        ),
        moteur.rappel(
          'b2-05-r-figee',
          'tableur',
          'Capital dû en D2, taux en K1 : quelle formule des intérêts recopier vers le bas ?',
          '=D2*$K$1',
          [['=D2*K1', NON_FIGEE]],
        ),
      ],
      obligatoires: ['b2-05-r-valeur-actuelle', 'b2-05-r-interets-emprunt'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-05-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : placer, emprunter',
      concepts: [...CONCEPTS_DES_MATHEMATIQUES_FINANCIERES],
    },
    [
      {
        title: 'Intérêts composés',
        description: 'Que vaudra le capital ?',
        back: 'Cₙ = C₀ × (1 + t)ⁿ. Les intérêts rapportent à leur tour. Intérêts simples : C₀ × (1 + n × t).',
      },
      {
        title: 'Valeur actuelle',
        description: 'Combien placer aujourd’hui ?',
        back: 'C₀ = Cₙ ÷ (1 + t)ⁿ. On divise pour remonter le temps ; la valeur actuelle est plus petite.',
      },
      {
        title: 'Suite d’annuités',
        description: 'Des versements réguliers ?',
        back: 'Vₙ = a × ((1 + t)ⁿ − 1) ÷ t, au dernier versement. Chaque versement a sa durée ; le dernier ne rapporte rien.',
      },
      {
        title: 'Annuité d’emprunt',
        description: 'Combien rembourser chaque année ?',
        back: 'a = C × t ÷ (1 − (1 + t)⁻ⁿ). Formule donnée au CCF.',
      },
      {
        title: 'Tableau d’amortissement',
        description: 'Une ligne par année ?',
        back: 'Intérêts = capital restant dû × t ; amortissement = a − intérêts ; capital dû suivant = capital − amortissement.',
      },
      {
        title: 'Coût du crédit',
        description: 'Combien coûte l’emprunt ?',
        back: 'n × a − C, ou la somme des intérêts. Le total remboursé n’est pas le coût.',
      },
      {
        title: 'VPM',
        description: 'L’annuité au tableur ?',
        back: 'VPM(taux ; durée ; −capital). Sans le signe moins, l’annuité s’affiche négative.',
      },
      {
        title: 'Tableur',
        description: 'Quelle formule recopier ?',
        back: 'Taux, versement et annuité figés par des $. SOMME pour un total, jamais la dernière cellule.',
      },
      {
        title: 'Capitaliser ou actualiser',
        description: 'Quel sens du temps ?',
        back: 'Vers le futur : × (1 + t)ⁿ. Vers le présent : ÷ (1 + t)ⁿ. Relire la question avant de calculer.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
  {
    screenId: 'B2-05-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la formule des intérêts',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 4,
    concepts: ['tableau-d-amortissement', 'tableur'],
    notes: moteur.puces(
      '4 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : taux non figé, addition au lieu de multiplication, coefficient à la place du taux.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-05-a4-billet',
          'tableau-d-amortissement',
          true,
          'Hélène prépare le tableau d’un nouvel emprunt : capital dû en début d’année en B2, taux annuel en H1. Quelle formule écrire en C2 pour les intérêts, à recopier vers le bas ?',
          '=B2*$H$1',
          [
            ['=B2*H1', NON_FIGEE],
            ['=B2+$H$1', 'nature-de-suite-confondue'],
            ['=B2*(1+$H$1)', TAUX_POUR_COEFFICIENT],
          ],
        ),
      ],
      invite:
        'En une phrase : pourquoi les intérêts d’un emprunt baissent-ils chaque année ?',
    },
  },
];
