import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import {
  ADDITIF,
  ATELIERS,
  ACHAT_AU_STAND,
  BASE_INVERSEE,
  BILLETS,
  BILLETS_EN_LIGNE,
  CONCEPTS_DES_PROPORTIONS,
  DONNEES_FICTIVES,
  FACTEUR_CENT,
  MARQUE_POUR_MARGE,
  MAUVAIS_TOUT,
  MOYENNE_SIMPLE,
  NON_FIGEE,
  OPTION_TOURNOI,
  PARCOURS_DU_COFFRE,
  PART_POUR_EVOLUTION,
  POINTS_POUR_POURCENTAGE,
  RENVOI_AU_FESTIVAL,
  TOTAL_DES_BILLETS,
  VALEUR_POUR_TAUX,
  VENTE_AU_STAND,
  enPourcentage,
  partArrondie,
  REPARTITION_DES_BILLETS,
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

const [PLACES_DU_SAMEDI, REMPLISSAGE_DU_SAMEDI] = ATELIERS[0];
const [PLACES_DU_DIMANCHE, REMPLISSAGE_DU_DIMANCHE] = ATELIERS[1];
const PART_DES_ETUDIANTS = BILLETS[1] / TOTAL_DES_BILLETS;
const MARGE_AU_STAND = VENTE_AU_STAND - ACHAT_AU_STAND;

export const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_FESTIVAL,
      titre: 'Mini-situation CCF : le Week-end du jeu',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['proportion', 'moyenne-ponderee', 'pourcentage', 'tableur'],
      notes: moteur.puces(
        'Mini-situation de 27 min (lecture 3, tableur 13, coffre 11), calculatrice, poste individuel ; barème sur 10 : tableur 3, énigmes 2, 2, 1,5 et 1,5.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : le Week-end du jeu',
      subtitle:
        'Le bilan du premier festival de Partie Libre. Barème sur 10 : une question tableur, puis quatre énigmes.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Contexte',
          contenu:
            'Partie Libre a organisé à Nantes le Week-end du jeu, son premier festival. Inès prépare le bilan pour la mairie, qui a prêté la salle.',
        },
        {
          rubrique: 'Billets',
          contenu:
            '960 billets vendus : 412 plein tarif, 288 étudiant, 172 enfant et 88 pass famille.',
        },
        {
          rubrique: 'Ventes en ligne',
          contenu: '150 des billets plein tarif ont été achetés en ligne.',
        },
        {
          rubrique: 'Option tournoi',
          contenu: '45 % des billets étudiant incluent l’option tournoi.',
        },
        {
          rubrique: 'Ateliers',
          contenu:
            'Samedi : 160 places, remplies à 85 %. Dimanche : 140 places, remplies à 60 %.',
        },
        {
          rubrique: 'Stand',
          contenu:
            'Un jeu acheté 32 € HT est vendu 50 € HT au stand de la boutique.',
        },
        moteur.BAREME_DE_LA_MINI_SITUATION,
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A4-02-TABLEUR-FESTIVAL',
      titre: 'Question tableur (3 points sur 10) : la répartition des billets',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 11,
      concepts: ['tableur', 'proportion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(3, 8),
        'Réflexion : chacun écrit sur papier la formule de C3, puis ce qu’elle devient en C4.',
        'Erreurs à chercher : B7 sans $ ; total tapé au clavier ; part sans × 100 ; ARRONDI oublié.',
        'Papier : formules écrites sur la copie ; en CCF, la question se fait devant l’examinateur.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_AU_FESTIVAL,
        plan: REPARTITION_DES_BILLETS.plan,
        questions: [
          moteur.questionDeFeuille(
            REPARTITION_DES_BILLETS.plan,
            REPARTITION_DES_BILLETS.attendus,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire C3, puis sa recopie en C4.',
        'Transition : « Avec ce bilan, ouvrez le coffre de la mini-situation. »',
      ],
    },
    [
      ['B7', `${REPARTITION_DES_BILLETS.formules.total} : 960 billets.`],
      [
        'C3 à C6',
        `${REPARTITION_DES_BILLETS.formules.part}, recopiée : 42,9 ; 30 ; 17,9 ; 9,2. Sans les $, C4 lit B8, vide : #DIV/0!. Sans × 100, 0,4 ; sans ARRONDI, 42,916….`,
      ],
      [
        'C7',
        `${REPARTITION_DES_BILLETS.formules.controle} : 100. Les parts arrondies tombent juste.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A4-03-COFFRE-FESTIVAL',
      titre: 'Mini-situation : le bilan du Week-end du jeu',
      diffusion: 'seance',
      brique: 'fp-escape',
      dureeMinutes: 9,
      concepts: ['proportion', 'moyenne-ponderee', 'pourcentage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 7),
        'Réflexion : relire le dossier et noter, pour chaque énigme, « parmi qui ? ».',
        'Indices disponibles après 60 s. À 6 min, projeter l’énigme la moins résolue.',
        'Papier : quatre questions rédigées du livret, sans code de coffre.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_AU_FESTIVAL,
        parcours: {
          id: PARCOURS_DU_COFFRE,
          intitule:
            'Le bilan du Week-end du jeu : quatre réponses pour ouvrir le coffre',
          delaiIndiceMs: 60000,
          budgetEnigmeMs: 150000,
          tentativesMax: 10,
          enigmes: [
            {
              id: 'b1-01-a4-e1-en-ligne',
              intitule: 'Les billets en ligne (2 points)',
              enonce:
                'Quelle part des billets plein tarif a été achetée en ligne, en %, arrondie au dixième ?',
              indice: 'Parmi qui ? Le tout, ce sont les billets plein tarif.',
            },
            {
              id: 'b1-01-a4-e2-tournoi',
              intitule: 'L’option tournoi (2 points)',
              enonce:
                'Quelle part de l’ensemble des billets sont des billets étudiant avec l’option tournoi, en %, arrondie au dixième ?',
              indice:
                'Une part des billets étudiant, qui sont eux-mêmes une part de tous les billets : on multiplie les deux parts.',
            },
            {
              id: 'b1-01-a4-e3-ateliers',
              intitule: 'Les ateliers (1,5 point)',
              enonce:
                'Quel est le taux de remplissage des ateliers sur tout le week-end, en %, arrondi au dixième ?',
              indice: 'Comptez les places remplies, pas les pourcentages.',
            },
            {
              id: 'b1-01-a4-e4-stand',
              intitule: 'Le stand (1,5 point)',
              enonce:
                'Quel est le taux de marque du jeu vendu au stand, en %, arrondi au dixième ?',
              indice:
                'La marque se lit sur l’étiquette : divisez la marge par le prix de vente.',
            },
          ],
        },
        questions: [
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            0,
            'b1-01-a4-e1-en-ligne',
            'proportion',
            partArrondie(BILLETS_EN_LIGNE, BILLETS[0]),
            moteur.UNE_DECIMALE,
            '36,4 %',
            'P7',
            [
              [partArrondie(BILLETS_EN_LIGNE, TOTAL_DES_BILLETS), MAUVAIS_TOUT],
              [partArrondie(BILLETS[0], BILLETS_EN_LIGNE), BASE_INVERSEE],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            1,
            'b1-01-a4-e2-tournoi',
            'proportion',
            enPourcentage(BILLETS[1] * OPTION_TOURNOI, TOTAL_DES_BILLETS),
            moteur.UNE_DECIMALE,
            '13,5 %',
            'J2',
            [
              [OPTION_TOURNOI * 100, MAUVAIS_TOUT],
              [PART_DES_ETUDIANTS * 100 + OPTION_TOURNOI * 100, ADDITIF],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            2,
            'b1-01-a4-e3-ateliers',
            'moyenne-ponderee',
            enPourcentage(
              PLACES_DU_SAMEDI * REMPLISSAGE_DU_SAMEDI +
                PLACES_DU_DIMANCHE * REMPLISSAGE_DU_DIMANCHE,
              PLACES_DU_SAMEDI + PLACES_DU_DIMANCHE,
            ),
            moteur.UNE_DECIMALE,
            '73,3 %',
            'R5',
            [
              [
                ((REMPLISSAGE_DU_SAMEDI + REMPLISSAGE_DU_DIMANCHE) / 2) * 100,
                MOYENNE_SIMPLE,
              ],
              [
                (REMPLISSAGE_DU_SAMEDI + REMPLISSAGE_DU_DIMANCHE) * 100,
                ADDITIF,
              ],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            3,
            'b1-01-a4-e4-stand',
            'pourcentage',
            partArrondie(MARGE_AU_STAND, VENTE_AU_STAND),
            moteur.UNE_DECIMALE,
            '36 %',
            'Q8',
            [
              [
                enPourcentage(MARGE_AU_STAND, ACHAT_AU_STAND),
                MARQUE_POUR_MARGE,
              ],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Dévoiler énigme par énigme, en s’attardant sur la moins résolue (pupitre).',
        'Finir sur le bilan d’Inès : chaque pourcentage dit de quel tout il parle.',
      ],
    },
    [
      [
        'b1-01-a4-e1-en-ligne',
        '150 ÷ 412 ≈ 0,364, soit 36,4 % des billets plein tarif. 150 ÷ 960 ≈ 15,6 % se rapporte à tous les billets : le mauvais tout.',
      ],
      [
        'b1-01-a4-e2-tournoi',
        'Étudiants : 288 ÷ 960 = 0,30. Avec tournoi : 0,30 × 0,45 = 0,135, soit 13,5 % des billets. 30 + 45 = 75 % additionne les parts.',
      ],
      [
        'b1-01-a4-e3-ateliers',
        'Places remplies : 0,85 × 160 + 0,60 × 140 = 136 + 84 = 220 sur 300, soit 73,3 %. La moyenne simple, 72,5 %, oublie que le samedi a plus de places.',
      ],
      [
        'b1-01-a4-e4-stand',
        'Marge : 50 − 32 = 18 €. Taux de marque : 18 ÷ 50 = 0,36, soit 36 %. 18 ÷ 32 ≈ 56,3 % est le taux de marge.',
      ],
    ],
  ),
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
  {
    screenId: 'B1-01-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la formule de la part',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 3,
    concepts: ['tableur', 'proportion'],
    notes: moteur.puces(
      '3 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : total non figé, division inversée, × 100 oublié.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-01-a4-billet',
          'tableur',
          true,
          'Effectif en B3, total en B7. Quelle formule écrire en C3 pour la part en %, arrondie au dixième, à recopier vers le bas ?',
          '=ARRONDI(B3/$B$7*100;1)',
          [
            ['=ARRONDI(B3/B7*100;1)', NON_FIGEE],
            ['=ARRONDI($B$7/B3*100;1)', BASE_INVERSEE],
            ['=ARRONDI(B3/$B$7;1)', FACTEUR_CENT],
          ],
        ),
      ],
      invite:
        'En une phrase : pourquoi se demander « parmi qui ? » devant un pourcentage ?',
    },
  },
];
