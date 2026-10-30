import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import {
  ARRONDI_OUBLIE,
  DONNEES_FICTIVES,
  FACTEUR_CENT,
  enPourcentage,
} from './b1-01.donnees';
import { ACTE_4 } from './b1-02.acte-4';
import {
  AUTRES_PRIX,
  BAISSE_DES_CARTES,
  BASE_ARRIVEE,
  CA_DES_BOUTIQUES,
  COEFFICIENT_GLOBAL,
  COEFFICIENT_POUR_TAUX,
  CONCEPTS_DU_COURS,
  ECART,
  EVOLUTION_DU_CA,
  GLOBAL_MAL_LU,
  HAUSSE_DE_2026,
  HAUSSE_DE_2027,
  INDICE_POUR_TAUX,
  INDICE_POUR_VALEUR,
  LIBELLES_DES_PRIX,
  MANETTE_TTC,
  MEME_TAUX_AU_RETOUR,
  NON_FIGEE_EN_LIGNE,
  PACK_APRES,
  PACK_AVANT,
  PREMIER_PRIX,
  PRIX_DE_DEPART,
  REMISE_DE_LA_CARTE,
  RENVOI_AU_DOSSIER,
  SANCTIONS_DE_LA_CNIL,
  SENS,
  SYMETRIE,
  TAUX_ADDITIONNES,
  TAUX_MOYEN_DIVISE,
  TVA,
  TVA_SUR_TTC,
} from './b1-02.donnees';
import * as moteur from './briques';
import { auMillionieme } from '../../../../common/domain/nombres/arrondi';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M7',
  chemin: '/assets/cours/gravures/v1/playfair-ble-salaires-1822.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Chart_Showing_at_One_View_the_Price_of_the_Quarter_of_Wheat,_and_Wages_of_Labour_by_the_Week,_from_1565_to_1821.png',
  auteur: 'William Playfair',
  date: '1822',
});

const PAGE_1 =
  '3 min ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.';
const PAGE_2 = '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B1-02-A1-01-DIAGNOSTIC-TAUX',
    titre: 'Diagnostic : un taux, sans calculatrice',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['taux-evolution'],
    notes: moteur.puces(
      '4 min : écrire au tableau l’adresse et le code de séance.',
      'Rappel du B1-01 : un taux se rapporte à la valeur de départ.',
      'Annoncer « seule la participation compte ». Sans calculatrice.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-02-a1-diagnostic-taux',
          'taux-evolution',
          true,
          'Un abonnement passe de 60 € à 75 €. Quel est son taux d’évolution ?',
          '+ 25 %',
          [
            ['+ 15 %', ECART],
            ['+ 20 %', BASE_ARRIVEE],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-02-A1-02-ACCROCHE',
      titre: 'Évolutions : multiplier, pas ajouter',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      notes: moteur.puces(
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
        'Dire que la trace écrite est imprimée dans le livret : on lit, on ne recopie pas.',
      ),
    },
    'hero',
    {
      title: 'Évolutions : multiplier, pas ajouter',
      subtitle:
        'Partie Libre revoit ses tarifs. Votre dossier : des hausses, de la TVA, des remises et un indice à lire.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Graphique de William Playfair (1822) : le prix du blé en barres et les salaires en courbe, de 1565 à 1821, une évolution suivie sur deux siècles et demi',
    },
  ),
  {
    screenId: 'B1-02-A1-03-VOTE-DIAGNOSTIC',
    titre: 'Vote : par quel nombre multiplier ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['coefficient-multiplicateur'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(1),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-02-a1-vote-hausse',
          'coefficient-multiplicateur',
          false,
          'Un prix augmente de 5 %. Par quel nombre le multiplier ?',
          '1,05',
          [
            ['0,05', COEFFICIENT_POUR_TAUX],
            ['1,5', FACTEUR_CENT],
          ],
        ),
        moteur.vote(
          'b1-02-a1-vote-remise',
          'coefficient-multiplicateur',
          false,
          'Une remise de 30 % sur un prix : par quel nombre le multiplier ?',
          '0,70',
          [
            ['0,30', COEFFICIENT_POUR_TAUX],
            ['1,30', SENS],
          ],
        ),
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le dossier tarifs de Partie Libre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire ce qui est HT et ce qui est TTC, ligne par ligne.',
      ),
    },
    'table',
    {
      title: 'Le dossier tarifs de Partie Libre',
      subtitle: 'Les chiffres de novembre 2026, avant la grille de prix 2027.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'L’entreprise',
          contenu:
            'Quatre boutiques-bars à jeux, à Nantes, Angers, Tours et Le Mans.',
        },
        {
          rubrique: 'Le chiffre d’affaires HT',
          contenu: `En milliers d’euros, 2025 puis 2026 : ${CA_DES_BOUTIQUES}.`,
        },
        { rubrique: 'La TVA', contenu: '20 % sur tous les prix de vente.' },
        {
          rubrique: 'La carte Pass Partie',
          contenu: '15 % de remise sur le prix TTC.',
        },
        {
          rubrique: 'Le fournisseur',
          contenu: 'Une hausse de 8 % annoncée au 1er janvier 2027.',
        },
        {
          rubrique: 'La question d’Inès',
          contenu: '« Quels coefficients pour la grille 2027 ? »',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B1-02-A1-05-MISSION',
    titre: 'Votre mission : vérifier la grille de prix',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['coefficient-multiplicateur', 'pourcentage'],
    notes: moteur.puces(
      'Lecture à voix haute (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Consigne orale : sans calculatrice. Enjeu : une grille fausse s’affiche dans les quatre boutiques.',
      'Question 2 : ajouter 20 % à 144 € ne redonne pas 180 € : Théo a retiré 20 % du mauvais prix.',
      'Question 3 : ne pas donner le bon prix, c’est l’exercice 1.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés, Nantes)',
      situation: [
        'Mardi, 14 h. Inès Marchal prépare la grille de prix 2027.',
        '« Nos achats montent de 8 % en janvier. Pouvez-vous vérifier les calculs de Théo avant que je valide ? »',
        'Théo a écrit : « Une console à 180 € TTC, c’est 144 € HT : j’enlève 20 %. »',
        'Il ajoute : « Une manette à 60 € TTC coûte 45 € avec la remise de 15 %. »',
      ].join('\n'),
      geste: null,
      consequence: null,
      questionsLibres: [
        {
          id: 'b1-02-a1-mission:taux',
          question:
            'Un jeu passe de 100 € à 112 €. Quel est le taux d’évolution, et par quel nombre a-t-on multiplié ?',
          placeholder: 'Le taux est de… on a multiplié par…',
        },
        {
          id: 'b1-02-a1-mission:ht',
          question:
            'Théo trouve 144 € HT. Que donne 144 € plus 20 % de TVA ? Que concluez-vous ?',
          placeholder: '144 € plus 20 % font… donc Théo…',
        },
        {
          id: 'b1-02-a1-mission:remise',
          question:
            'Pour la manette à 45 €, qu’a fait Théo ? Quel calcul proposez-vous ?',
          placeholder: 'Théo a… il faudrait…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-02-A1-06-COURS-COEFFICIENT',
      titre: 'Cours : taux et coefficient multiplicateur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      notes: moteur.puces(
        PAGE_1,
        'Faire répéter le moyen mnémotechnique : toujours le départ en bas.',
        'Lien à la mission : « De 100 € à 112 € : quel coefficient ? »',
      ),
    },
    'lesson',
    {
      title: 'Taux et coefficient : multiplier, pas ajouter',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le coefficient multiplicateur',
          text: 'Évoluer de t, c’est multiplier par 1 + t.\nUne hausse donne c plus grand que 1, une baisse plus petit.',
          formula: 't = (V₂ − V₁) ÷ V₁\nc = 1 + t\nV₂ = V₁ × c\nV₁ = V₂ ÷ c',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la place de cinéma',
          text: 'Une place passe de 10 € à 12 €.',
          steps: [
            't = 2 ÷ 10 = 0,2, soit + 20 %.',
            'c = 1 + 0,2 = 1,2 ; contrôle : 10 × 1,2 = 12 €.',
            'À − 20 %, c = 0,8 : 10 × 0,8 = 8 €.',
          ],
        },
        {
          kind: 'method',
          title: 'Toujours le départ en bas',
          text: 'Le taux se rapporte à la valeur de départ.',
          steps: [
            'Repérer V₁ (le départ) et V₂ (l’arrivée).',
            'Écrire t en décimal, puis c = 1 + t.',
            'Contrôle : hausse, c > 1 ; baisse, c < 1.',
            'Au tableur, arrondie et recopiée : =ARRONDI((B3-B2)/B2*100;1).',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-02-A1-07-COURS-HT-TTC',
      titre: 'Cours : HT, TTC et remises',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['coefficient-multiplicateur', 'pourcentage'],
      notes: moteur.puces(
        PAGE_2,
        'Faire répéter le moyen mnémotechnique : aller, ×, retour, ÷.',
        'Lien à la mission : la console de Théo, à 180 € TTC.',
      ),
    },
    'lesson',
    {
      title: 'HT, TTC, remise : toujours un coefficient',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Du HT au TTC',
          text: 'La TVA se calcule sur le prix HT.\nÀ 20 %, le coefficient vaut 1,20.',
          formula:
            'TTC = HT × 1,20\nHT = TTC ÷ 1,20\nremise de r : prix × (1 − r)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le casque',
          text: 'Un casque à 30 € HT, TVA à 20 %, puis une remise de 10 %.',
          steps: [
            '30 × 1,20 = 36 € TTC.',
            'Retour : 36 ÷ 1,20 = 30 € HT.',
            'Remise : 36 × 0,90 = 32,40 €.',
          ],
        },
        {
          kind: 'method',
          title: 'Aller : ×, retour : ÷',
          text: 'Le retour divise par le même coefficient.',
          steps: [
            'Du HT au TTC : × 1,20.',
            'Du TTC au HT : ÷ 1,20, jamais − 20 %.',
            'Une remise : × (1 − r), jamais r en euros.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-02-A1-08-EXEMPLE-JEU',
      titre: 'Exemple guidé : un jeu de société, de l’achat à la caisse',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['coefficient-multiplicateur', 'pourcentage'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-02-a1-exemple-jeu',
          enonce:
            'Un jeu de société s’achète 40 € HT, puis 46 € HT en janvier. Il se vend 75 € HT, TVA à 20 %. La carte Pass Partie donne 15 % de remise sur le prix TTC.',
          etapes: [
            {
              id: 'taux',
              intitule: 'Le taux d’évolution',
              raisonnement: '(46 − 40) ÷ 40 = 0,15, soit + 15 %.',
              invite: 'Quel est le taux d’évolution du prix d’achat ?',
            },
            {
              id: 'coefficient',
              intitule: 'Le coefficient',
              raisonnement:
                'c = 1 + 0,15 = 1,15 ; contrôle : 40 × 1,15 = 46 €.',
              invite: 'Par quel nombre a-t-on multiplié ?',
            },
            {
              id: 'ttc',
              intitule: 'Le prix TTC',
              raisonnement: '75 × 1,20 = 90 € TTC.',
              invite: 'Quel est le prix de vente TTC ?',
            },
            {
              id: 'piege',
              intitule: 'Retrouver le HT',
              raisonnement:
                '90 ÷ 1,20 = 75 € HT. Enlever 20 % donnerait 90 × 0,80 = 72 € : faux, la TVA se calcule sur le HT.',
              invite:
                'Comment retrouver le HT depuis 90 € TTC ? Pourquoi pas − 20 % ?',
            },
            {
              id: 'remise',
              intitule: 'La remise',
              raisonnement: '90 × 0,85 = 76,50 € TTC.',
              invite: 'Combien paie un client avec la carte ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le retour au HT (étape 4) : on divise, on ne retire pas 20 %.',
        'Transition : « À vous, sur la nouvelle grille : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-02-A1-09-ATELIER-PRIX',
      titre: 'Exercice 1 — La nouvelle grille',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['taux-evolution', 'coefficient-multiplicateur', 'pourcentage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire « départ » et « arrivée » devant chaque prix.',
        'Pièges : écart en euros ; base d’arrivée ; − 20 % sur le TTC.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 1 — La nouvelle grille',
        consigne:
          'Un pack de cartes passe de 16 € à 18 € HT. Une manette se vend 60 € TTC, TVA à 20 %, et la carte donne 15 % de remise.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-02-a1-taux-pack',
            'taux-evolution',
            'Quel est le taux d’évolution du pack de cartes ?',
            '%',
            enPourcentage(PACK_APRES - PACK_AVANT, PACK_AVANT),
            moteur.UNE_DECIMALE,
            '12,5 %',
            [
              [PACK_APRES - PACK_AVANT, ECART],
              [
                enPourcentage(PACK_APRES - PACK_AVANT, PACK_APRES),
                BASE_ARRIVEE,
              ],
            ],
          ),
          moteur.vote(
            'b1-02-a1-coefficient',
            'coefficient-multiplicateur',
            true,
            'Le fournisseur annonce + 8 %. Par quel nombre multiplier les prix d’achat ?',
            '1,08',
            [
              ['0,08', COEFFICIENT_POUR_TAUX],
              ['1,8', FACTEUR_CENT],
            ],
          ),
          moteur.numerique(
            'b1-02-a1-ht',
            'pourcentage',
            'Quel est le prix HT de la manette ?',
            '€',
            auMillionieme(MANETTE_TTC / (1 + TVA)),
            moteur.TOLERANCE_NULLE,
            '50 €',
            [
              [auMillionieme(MANETTE_TTC * (1 - TVA)), TVA_SUR_TTC],
              [auMillionieme(MANETTE_TTC * (1 + TVA)), SENS],
            ],
          ),
          moteur.numerique(
            'b1-02-a1-remise',
            'coefficient-multiplicateur',
            'Quel prix TTC paie un client avec la carte ?',
            '€',
            auMillionieme(MANETTE_TTC * (1 - REMISE_DE_LA_CARTE)),
            moteur.TOLERANCE_NULLE,
            '51 €',
            [
              [MANETTE_TTC - REMISE_DE_LA_CARTE * 100, ECART],
              [
                auMillionieme(MANETTE_TTC * REMISE_DE_LA_CARTE),
                COEFFICIENT_POUR_TAUX,
              ],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Faisons calculer tous les taux par le tableur : exercice 2. »',
      ],
    },
    [
      [
        'b1-02-a1-taux-pack',
        '(18 − 16) ÷ 16 = 0,125, soit + 12,5 %. Diviser par 18 donnerait 11,1 % : le taux se rapporte au départ.',
      ],
      [
        'b1-02-a1-coefficient',
        '1 + 0,08 = 1,08. Le taux est 0,08, le coefficient 1,08.',
      ],
      [
        'b1-02-a1-ht',
        '60 ÷ 1,20 = 50 € HT. Retirer 20 % donnerait 48 € : la TVA se calcule sur le HT.',
      ],
      [
        'b1-02-a1-remise',
        '60 × 0,85 = 51 €. Théo a retiré 15 €, or 15 % n’est pas 15 €.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-02-A1-10-TABLEUR-CA',
      titre: 'Exercice 2 — L’évolution du chiffre d’affaires au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 7,
      concepts: ['tableur', 'taux-evolution'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 5),
        'Réflexion : écrire sur papier la formule de D2, puis ce qu’elle devient en D3 une fois recopiée.',
        'Erreurs à chercher : base d’arrivée ; écart sans division ; total tapé au clavier ; ARRONDI oublié.',
        'Papier : formules écrites sur la copie, puis les taux à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: EVOLUTION_DU_CA.plan,
        questions: [
          moteur.questionDeFeuille(
            EVOLUTION_DU_CA.plan,
            EVOLUTION_DU_CA.attendus,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_PREMIERE_PAUSE,
    [
      ['B6 et C6', '=SOMME(B2:B5) et =SOMME(C2:C5) : 480 et 519.'],
      [
        'D2 à D6',
        `${EVOLUTION_DU_CA.formules.taux}, recopiée : 12,5 ; 5 ; −4,2 ; 17,5 ; 8,1. Ici, pas de $ : chaque ligne a son propre départ.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-02-A1-11-JALON',
      titre: 'Jalon 1 : du taux au coefficient',
      concepts: ['coefficient-multiplicateur', 'tableur'],
    },
    {
      id: 'b1-02-a1-jalon',
      invite:
        'Je sais passer d’un taux à un coefficient, du HT au TTC, et écrire un taux au tableur.',
    },
    'Si plus de 30 % « Perdu » : reprendre la page A1-06 après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B1-02-A2-01-REFLEXION-SOLDES',
      titre: 'Réfléchir : + 10 %, puis − 10 %',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['evolutions-successives'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Les 10 % de la baisse se calculent sur quel prix ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b1-02-a2-reflexion-soldes',
        type: 'reflection',
        question:
          'En janvier, Partie Libre augmente de 10 % un jeu à 100 €. En février, il est soldé à − 10 %. Théo écrit : « On retrouve le prix de départ. » Sans calculatrice : a-t-il raison ? Sur quel prix se calcule la baisse ?',
        placeholder: 'Il a raison / tort, parce que la baisse porte sur…',
        competency: 'Raisonner · enchaîner deux évolutions',
      },
    },
    {
      correction: {
        expected:
          'Il a tort : la baisse se calcule sur 110 €. 100 × 1,10 × 0,90 = 99 € : le prix final a baissé de 1 %.',
        nextAction:
          'Gardez votre réponse : la trace écrite multiplie les coefficients.',
      },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-02-A2-02-COURS-SUCCESSIVES',
      titre: 'Cours : évolutions successives',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['evolutions-successives'],
      notes: moteur.puces(
        PAGE_1,
        'Question : « + 10 % puis + 20 %, pourquoi pas + 30 % ? » La seconde hausse porte sur un prix déjà monté.',
        'Faire répéter le moyen mnémotechnique : coefficients, jamais taux.',
      ),
    },
    'lesson',
    {
      title: 'Évolutions successives : on multiplie',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Un coefficient par évolution',
          text: 'Des évolutions successives multiplient leurs coefficients.\nLe taux global se lit sur le coefficient global.',
          formula: 'C = c₁ × c₂ × … × cₙ\ntaux global = C − 1',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le loyer',
          text: 'Un loyer augmente de 10 %, puis de 20 %.',
          steps: [
            'c₁ = 1,10 et c₂ = 1,20.',
            'C = 1,10 × 1,20 = 1,32.',
            'Taux global : + 32 %, pas + 30 %.',
          ],
        },
        {
          kind: 'method',
          title: 'Coefficients, jamais taux',
          text: 'Chaque évolution porte sur le résultat de la précédente.',
          steps: [
            'Écrire chaque évolution en coefficient.',
            'Multiplier les coefficients.',
            'Retirer 1 : C = 0,97 se lit − 3 %.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-02-A2-03-COURS-RECIPROQUE',
      titre: 'Cours : évolution réciproque',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['evolution-reciproque'],
      notes: moteur.puces(
        PAGE_2,
        'Question : « − 50 %, puis + 50 % : on revient au départ ? » Non : il faut + 100 %.',
        'Faire répéter le moyen mnémotechnique : le retour n’a pas le même taux.',
      ),
    },
    'lesson',
    {
      title: 'Évolution réciproque : revenir au départ',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Défaire une évolution',
          text: 'Revenir au départ, c’est diviser par c.\nLe taux du retour n’est pas celui de l’aller.',
          formula: 'c réciproque = 1 ÷ c\nt réciproque = 1 ÷ c − 1',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le vélo',
          text: 'Le prix d’un vélo baisse de 50 %.',
          steps: [
            'c = 0,5.',
            '1 ÷ 0,5 = 2.',
            'Pour revenir au prix : + 100 %, pas + 50 %.',
          ],
        },
        {
          kind: 'method',
          title: 'Le retour n’a pas le même taux',
          text: 'On part du coefficient de l’aller.',
          steps: [
            'Écrire le coefficient de l’aller.',
            'Diviser 1 par ce coefficient.',
            'Retirer 1 et lire le taux.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-02-A2-04-EXEMPLE-PROMO',
      titre: 'Exemple guidé : hausse, puis promotion',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['evolutions-successives', 'evolution-reciproque'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-02-a2-exemple-promo',
          enonce:
            'Un jeu à 80 € augmente de 25 % en janvier, puis baisse de 20 % en février. Un autre jeu passe de 50 € à 40 €.',
          etapes: [
            {
              id: 'coefficients',
              intitule: 'Les coefficients',
              raisonnement: 'c₁ = 1,25 et c₂ = 0,80.',
              invite: 'Quels sont les deux coefficients ?',
            },
            {
              id: 'global',
              intitule: 'Le coefficient global',
              raisonnement:
                'C = 1,25 × 0,80 = 1 : le jeu revient exactement à 80 €.',
              invite: 'Quel est le coefficient global ?',
            },
            {
              id: 'piege',
              intitule: 'Additionner les taux',
              raisonnement:
                '+ 25 − 20 = + 5 % serait faux : 80 × 1,05 = 84 €, pas 80 €.',
              invite:
                'Que donnerait l’addition des taux ? Pourquoi est-ce faux ?',
            },
            {
              id: 'baisse',
              intitule: 'Le second jeu',
              raisonnement: '40 ÷ 50 = 0,8 : une baisse de 20 %.',
              invite: 'Quel est le coefficient du second jeu ?',
            },
            {
              id: 'reciproque',
              intitule: 'Le retour',
              raisonnement: '1 ÷ 0,8 = 1,25 : il faudrait + 25 %, pas + 20 %.',
              invite: 'Quelle hausse ramène le second jeu à 50 € ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’addition des taux (étape 3) et sur le retour (étape 5).',
        'Transition : « À vous : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-02-A2-05-TABLEAU-PRIX',
      titre: 'Exercice 3 — Une hausse, puis des soldes',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 6,
      concepts: ['evolutions-successives'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : dire sur quel prix porte chaque évolution.',
        'Pièges : soldes calculés sur le prix de départ ; montant de la baisse saisi au lieu du nouveau prix.',
        'Papier : tableau du livret, rempli à la main.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: {
          id: 'b1-02-a2-tableau-prix',
          intitule: 'Quatre prix, deux évolutions',
          consignes: [
            'Pour chaque article, saisissez le prix après la hausse de 20 %, puis le prix après les soldes de − 25 %.',
            'Les totaux et l’évolution globale se calculent seuls à partir de vos saisies.',
          ],
          echeances: LIBELLES_DES_PRIX.length,
          intituleDesLignes: 'Article',
          libellesLignes: [...LIBELLES_DES_PRIX],
          parametres: {},
          colonnes: [
            {
              cle: 'depart',
              intitule: 'Prix de départ (€)',
              role: 'donnee',
              valeurs: [...PRIX_DE_DEPART],
              decimales: 0,
              totalise: true,
            },
            {
              cle: 'hausse',
              intitule: 'Après + 20 % (€)',
              role: 'saisie',
              decimales: 0,
              totalise: true,
            },
            {
              cle: 'soldes',
              intitule: 'Après − 25 % (€)',
              role: 'saisie',
              decimales: 0,
              totalise: true,
            },
          ],
          synthese: [
            {
              libelle: 'Évolution globale',
              formule: '(totalSoldes / totalDepart - 1) * 100',
              unite: '%',
              decimales: 1,
            },
          ],
        },
        questions: [
          moteur.questionDeTableau(
            'b1-02-a2-tableau-prix',
            'evolutions-successives',
            [PREMIER_PRIX, ...AUTRES_PRIX],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste ; comparer à l’addition des taux, − 5 %.',
        'Transition : « Le coefficient global se lit : exercice 4. »',
      ],
    },
    [
      [
        'b1-02-a2-tableau-prix',
        'Après hausse : 144 ; 96 ; 72 ; 48. Après soldes : 108 ; 72 ; 54 ; 36. C = 1,20 × 0,75 = 0,9 : − 10 %, pas − 5 %.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-02-A2-06-ATELIER-RETOUR',
      titre: 'Exercice 4 — Deux hausses, un retour',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['evolutions-successives', 'evolution-reciproque'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire chaque évolution en coefficient avant de calculer.',
        'Pièges : taux additionnés ; coefficient lu comme un taux ; même taux au retour.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 4 — Deux hausses, un retour',
        consigne:
          'Le chiffre d’affaires des jeux vidéo augmente de 10 %, puis de 5 %. Les ventes de cartes à collectionner baissent de 40 %.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-02-a2-coefficient-global',
            'evolutions-successives',
            'Quel est le coefficient global des deux hausses ?',
            null,
            COEFFICIENT_GLOBAL,
            moteur.TOLERANCE_RELATIVE,
            '1,155',
            [
              [
                auMillionieme(1 + HAUSSE_DE_2026 + HAUSSE_DE_2027),
                TAUX_ADDITIONNES,
              ],
              [auMillionieme(COEFFICIENT_GLOBAL - 1), COEFFICIENT_POUR_TAUX],
            ],
          ),
          moteur.numerique(
            'b1-02-a2-taux-global',
            'evolutions-successives',
            'Quel est le taux d’évolution global ?',
            '%',
            auMillionieme((COEFFICIENT_GLOBAL - 1) * 100),
            moteur.UNE_DECIMALE,
            '15,5 %',
            [
              [
                auMillionieme((HAUSSE_DE_2026 + HAUSSE_DE_2027) * 100),
                TAUX_ADDITIONNES,
              ],
              [auMillionieme(COEFFICIENT_GLOBAL * 100), GLOBAL_MAL_LU],
            ],
          ),
          moteur.vote(
            'b1-02-a2-phrase',
            'evolutions-successives',
            true,
            'Un prix baisse de 40 %, puis remonte de 40 %. Quelle phrase est juste ?',
            'Il reste sous le prix de départ',
            [['Il revient au prix de départ', SYMETRIE]],
          ),
          moteur.numerique(
            'b1-02-a2-reciproque',
            'evolution-reciproque',
            'Quelle hausse ramènerait les ventes de cartes à leur niveau de départ, arrondie au dixième ?',
            '%',
            auMillionieme((1 / (1 - BAISSE_DES_CARTES) - 1) * 100),
            moteur.UNE_DECIMALE,
            '66,7 %',
            [
              [auMillionieme(BAISSE_DES_CARTES * 100), MEME_TAUX_AU_RETOUR],
              [auMillionieme((1 - BAISSE_DES_CARTES) * 100), SENS],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Transition : « Faisons le point : enchaîner et revenir. »',
      ],
    },
    [
      [
        'b1-02-a2-coefficient-global',
        '1,10 × 1,05 = 1,155. Additionner donnerait 1,15 : la seconde hausse porte sur un montant déjà monté.',
      ],
      ['b1-02-a2-taux-global', '1,155 − 1 = 0,155, soit + 15,5 %, pas + 15 %.'],
      [
        'b1-02-a2-phrase',
        '0,60 × 1,40 = 0,84 : le prix reste 16 % sous le départ.',
      ],
      [
        'b1-02-a2-reciproque',
        '1 ÷ 0,60 ≈ 1,667, soit + 66,7 %. Le retour ne reprend pas le taux de l’aller.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-02-A2-07-JALON',
      titre: 'Jalon 2 : enchaîner et revenir',
      concepts: ['evolutions-successives', 'evolution-reciproque'],
    },
    {
      id: 'b1-02-a2-jalon',
      invite:
        'Je sais multiplier des coefficients, lire un taux global et calculer le taux du retour.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple du loyer de la trace écrite A2-02.',
  ),
];

const ACTE_3: moteur.Acte = [
  {
    screenId: 'B1-02-A3-01-VOTE-INDICES',
    titre: 'Vote : que dit un indice ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['indice-base-100', 'taux-moyen'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-02-a3-indice',
          'indice-base-100',
          false,
          'L’indice d’un prix vaut 130, base 100 en 2020. Que signifie-t-il ?',
          '+ 30 % depuis 2020',
          [
            ['+ 130 % depuis 2020', INDICE_POUR_TAUX],
            ['Le prix vaut 130 €', INDICE_POUR_VALEUR],
          ],
        ),
        moteur.vote(
          'b1-02-a3-moyen',
          'taux-moyen',
          false,
          'Une valeur augmente de 21 % en deux ans. Quel taux constant, chaque année, donne le même résultat ?',
          '+ 10 % par an',
          [['+ 10,5 % par an', TAUX_MOYEN_DIVISE]],
        ),
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-02-A3-02-COURS-INDICE',
      titre: 'Cours : indice base 100',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['indice-base-100', 'tableur'],
      notes: moteur.puces(
        PAGE_1,
        'Question : « 150, c’est un prix ? un taux ? » Ni l’un ni l’autre.',
        'Faire répéter le moyen mnémotechnique : ni un prix, ni un taux.',
      ),
    },
    'lesson',
    {
      title: 'Indice base 100 : comparer à une année',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une année de base',
          text: 'L’indice vaut 100 l’année de base.\nIl dit où en est la valeur par rapport à cette année.',
          formula:
            'I = V ÷ V₀ × 100\ntaux depuis la base = I − 100\ntaux entre deux dates = I₂ ÷ I₁ − 1',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le ticket de bus',
          text: 'Un ticket coûte 2 € en 2020 et 3 € en 2025.',
          steps: [
            'I = 3 ÷ 2 × 100 = 150.',
            '150 − 100 = 50 : + 50 % depuis 2020.',
            '150 n’est ni un prix, ni + 150 %.',
          ],
        },
        {
          kind: 'method',
          title: 'Ni un prix, ni un taux',
          text: 'Au tableur, la valeur de base reste figée.',
          steps: [
            'Années en colonne, base en B2 ; en C3 : =B3/$B$2*100.',
            'Recopier : le $ garde la même base.',
            'Lire : I − 100 donne le taux depuis la base.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-02-A3-03-COURS-TAUX-MOYEN',
      titre: 'Cours : taux annuel moyen',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['taux-moyen', 'tableur'],
      notes: moteur.puces(
        PAGE_2,
        'Question : « De 2021 à 2024, combien d’évolutions ? » Trois, pas quatre.',
        'Faire répéter le moyen mnémotechnique : n compte les évolutions.',
      ),
    },
    'lesson',
    {
      title: 'Taux moyen : la même hausse chaque année',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Un taux constant équivalent',
          text: 'Le taux moyen donne la même évolution globale, à taux constant.\nOn prend la puissance 1/n du coefficient global.',
          formula:
            'c moyen = C^(1/n)\nt moyen = C^(1/n) − 1\ntableur : =PUISSANCE(C;1/n)-1',
        },
        {
          kind: 'example',
          title: 'Pour débuter : l’épargne',
          text: 'Un compte passe de 100 € à 169 € en 2 ans.',
          steps: [
            'C = 169 ÷ 100 = 1,69.',
            'c moyen = 1,69^(1/2) = 1,3.',
            '+ 30 % par an, pas + 34,5 %.',
          ],
        },
        {
          kind: 'method',
          title: 'n compte les évolutions',
          text: 'Compter les évolutions, pas les années citées.',
          steps: [
            'C = arrivée ÷ départ.',
            'De 2021 à 2024 : n = 3.',
            'Contrôle : c moyen puissance n redonne C.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-02-A3-04-EXEMPLE-CLIENTS',
      titre: 'Exemple guidé : les clients du réseau',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['indice-base-100', 'taux-moyen'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-02-a3-exemple-clients',
          enonce:
            'Partie Libre compte 2 000 clients en 2023, 2 300 en 2024, 2 900 en 2025 et 3 456 en 2026.',
          etapes: [
            {
              id: 'indice',
              intitule: 'L’indice de 2024',
              raisonnement: '2 300 ÷ 2 000 × 100 = 115.',
              invite: 'Quel est l’indice de 2024, base 100 en 2023 ?',
            },
            {
              id: 'lire',
              intitule: 'Lire l’indice de 2025',
              raisonnement: '2 900 ÷ 2 000 × 100 = 145 : + 45 % depuis 2023.',
              invite: 'Quel est l’indice de 2025 ? Que signifie-t-il ?',
            },
            {
              id: 'global',
              intitule: 'L’évolution globale',
              raisonnement: '3 456 ÷ 2 000 = 1,728, soit + 72,8 %.',
              invite: 'Quelle est l’évolution de 2023 à 2026 ?',
            },
            {
              id: 'moyen',
              intitule: 'Le taux annuel moyen',
              raisonnement: 'n = 3 : 1,728^(1/3) = 1,2, soit + 20 % par an.',
              invite: 'Quel est le taux annuel moyen ?',
            },
            {
              id: 'piege',
              intitule: 'Diviser par 3 ?',
              raisonnement:
                '72,8 ÷ 3 ≈ 24,3 % : faux, car 1,243³ ≈ 1,92, pas 1,728.',
              invite: 'Pourquoi ne pas diviser 72,8 % par 3 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur n = 3 (étape 4) et sur la division par 3 (étape 5).',
        'Transition : « À vous, sur un vrai sujet de BTS : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-02-A3-05-TABLEUR-CNIL',
      titre: 'Exercice 5 — Les sanctions de la CNIL',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'indice-base-100', 'taux-moyen'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : le tableau est en ligne, comme au sujet : la recopie va vers la droite.',
        'Erreurs à chercher : base non figée ; ARRONDI oublié ; taux global divisé par 3.',
        'Papier : formules écrites sur la copie avec la grille des cellules.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: SANCTIONS_DE_LA_CNIL.plan,
        questions: [
          moteur.questionDeFeuille(
            SANCTIONS_DE_LA_CNIL.plan,
            SANCTIONS_DE_LA_CNIL.attendus,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'C3 à E3',
        `${SANCTIONS_DE_LA_CNIL.formules.indice}, recopiée vers la droite : 116,7 ; 233,3 ; 483,3. Au sujet, la ligne est au format nombre : =C2/$B$2*100 y suffit.`,
      ],
      [
        'B5',
        `${SANCTIONS_DE_LA_CNIL.formules.taux} : + 314,3 %. Le départ est 2022, donc 21.`,
      ],
      [
        'B6',
        `${SANCTIONS_DE_LA_CNIL.formules.hausse} : + 383,3 %. L’indice 483,3 le dit aussi : 483,3 − 100.`,
      ],
      [
        'B7',
        `${SANCTIONS_DE_LA_CNIL.formules.moyen} : + 69,1 % par an. De 2021 à 2024, n = 3.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-02-A3-06-JALON',
      titre: 'Jalon 3 : indice et taux moyen',
      concepts: ['indice-base-100', 'taux-moyen'],
    },
    {
      id: 'b1-02-a3-jalon',
      invite:
        'Je sais calculer et lire un indice, et calculer un taux annuel moyen.',
    },
    moteur.PAUSE_HORS_DUREE,
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [ECART]: 'B1-02-A1-06-COURS-COEFFICIENT',
  [BASE_ARRIVEE]: 'B1-02-A1-06-COURS-COEFFICIENT',
  [COEFFICIENT_POUR_TAUX]: 'B1-02-A1-06-COURS-COEFFICIENT',
  [FACTEUR_CENT]: 'B1-02-A1-06-COURS-COEFFICIENT',
  [SENS]: 'B1-02-A1-06-COURS-COEFFICIENT',
  [ARRONDI_OUBLIE]: 'B1-02-A1-06-COURS-COEFFICIENT',
  'valeur-saisie-sans-formule': 'B1-02-A1-06-COURS-COEFFICIENT',
  'formule-non-recopiable': 'B1-02-A1-06-COURS-COEFFICIENT',
  [TVA_SUR_TTC]: 'B1-02-A1-07-COURS-HT-TTC',
  [TAUX_ADDITIONNES]: 'B1-02-A2-02-COURS-SUCCESSIVES',
  [SYMETRIE]: 'B1-02-A2-02-COURS-SUCCESSIVES',
  [GLOBAL_MAL_LU]: 'B1-02-A2-02-COURS-SUCCESSIVES',
  [MEME_TAUX_AU_RETOUR]: 'B1-02-A2-03-COURS-RECIPROQUE',
  [INDICE_POUR_TAUX]: 'B1-02-A3-02-COURS-INDICE',
  [INDICE_POUR_VALEUR]: 'B1-02-A3-02-COURS-INDICE',
  [NON_FIGEE_EN_LIGNE]: 'B1-02-A3-02-COURS-INDICE',
  'formule-non-recopiable-en-ligne': 'B1-02-A3-02-COURS-INDICE',
  [TAUX_MOYEN_DIVISE]: 'B1-02-A3-03-COURS-TAUX-MOYEN',
};

export const COURS_B1_02 = moteur.coursB1(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [GRAVURE_DE_L_ACCROCHE],
  {
    slug: 'b1-02-evolutions-coefficients-indices',
    titre: 'Évolutions : taux, coefficients, indices',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
