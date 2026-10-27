import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { ACTE_4 } from './b1-01.acte-4';
import {
  ADDITIF,
  ALTERNANTS,
  ALTERNANTS_DE_NANTES,
  ARRONDI_OUBLIE,
  AUTRES_PORTEURS,
  BASE_INVERSEE,
  BOUTIQUES,
  CLIENTS,
  CLIENTS_D_OCTOBRE,
  CONCEPTS_DU_COURS,
  DONNEES_FICTIVES,
  FACTEUR_CENT,
  MARQUE_POUR_MARGE,
  MAUVAIS_TOUT,
  MOYENNE_SIMPLE,
  NON_FIGEE,
  OBJECTIF_D_ALTERNANCE,
  PART_POUR_EVOLUTION,
  POINTS_POUR_POURCENTAGE,
  PART_DES_JEUNES_2025,
  PART_DES_JEUNES_2026,
  ECART_DES_JEUNES,
  PREMIERS_PORTEURS,
  RENVOI_AU_DOSSIER,
  RESERVATION_EN_LIGNE,
  SALARIES,
  SALARIES_DE_NANTES,
  TAUX_DE_LA_CARTE,
  TAUX_D_OCTOBRE,
  TOTAL_DES_CLIENTS,
  TOTAL_DES_PORTEURS,
  VALEUR_POUR_TAUX,
  ACHAT_DE_LA_MANETTE,
  VENTE_DE_LA_MANETTE,
  enPourcentage,
  REPARTITION_DES_CLIENTS,
} from './b1-01.donnees';
import * as moteur from './briques';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M7',
  chemin: '/assets/cours/gravures/v1/playfair-camemberts-1801.jpg',
  pageSource: 'https://commons.wikimedia.org/wiki/File:Playfair_piecharts.jpg',
  auteur: 'William Playfair, The Statistical Breviary',
  date: '1801',
});

const DOSSIER_DES_ILLUSTRATIONS = '/assets/cours/b1-01/v1';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B1-01-A1-01-DIAGNOSTIC-PART',
    titre: 'Diagnostic : une part, sans calculatrice',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['proportion'],
    notes: moteur.puces(
      '4 min : c’est le premier écran de leur BTS ; écrire au tableau l’adresse et le code de séance.',
      'Attendre au pupitre que tous les postes aient rejoint avant de lancer.',
      'Annoncer « seule la participation compte ». Sans calculatrice.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-01-a1-diagnostic-part',
          'proportion',
          true,
          'Sur 200 clients, 40 ont payé par carte. Quelle part des clients a payé par carte ?',
          '20 %',
          [
            ['40 %', VALEUR_POUR_TAUX],
            ['500 %', BASE_INVERSEE],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-01-A1-02-ACCROCHE',
      titre: 'Proportions et pourcentages : parmi qui ?',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['proportion', 'pourcentage', 'point-de-pourcentage'],
      notes: moteur.puces(
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
        'Dire que la trace écrite est imprimée dans le livret : on lit, on ne recopie pas.',
      ),
    },
    'hero',
    {
      title: 'Proportions et pourcentages : parmi qui ?',
      subtitle:
        'Partie Libre, quatre boutiques-bars à jeux. Votre alternance commence par le bilan de rentrée : des effectifs, des parts, des marges.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Diagrammes circulaires de William Playfair (1801) : la part de chaque territoire dans un tout, les premiers camemberts publiés',
    },
  ),
  {
    screenId: 'B1-01-A1-03-VOTE-DIAGNOSTIC',
    titre: 'Vote : deux pourcentages du lycée',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['pourcentage', 'taux-evolution'],
    notes: moteur.puces(
      'Diagnostic : deux votes non notés, sans calculatrice. Repérer au pupitre les postes sous 50 %.',
      ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-01-a1-diagnostic-pourcentage',
          'pourcentage',
          false,
          'Combien font 15 % de 80 € ?',
          '12 €',
          [
            ['65 €', ADDITIF],
            ['1 200 €', FACTEUR_CENT],
          ],
        ),
        moteur.vote(
          'b1-01-a1-diagnostic-evolution',
          'taux-evolution',
          false,
          'Un prix passe de 50 € à 60 €. De combien a-t-il augmenté, en % ?',
          '+ 20 %',
          [
            ['+ 10 %', 'ecart-absolu-au-lieu-du-taux'],
            ['+ 16,7 %', 'base-arrivee'],
          ],
        ),
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le bilan de rentrée de Partie Libre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proportion', 'moyenne-ponderee'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire de quoi parle chaque ligne : des salariés, des clients, des porteurs de carte.',
      ),
    },
    'table',
    {
      title: 'Le bilan de rentrée de Partie Libre',
      subtitle: 'Les chiffres du 1er octobre 2026, à vérifier avant l’envoi.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'L’entreprise',
          contenu:
            'Quatre boutiques-bars à jeux (jeux de société, consoles et jeux vidéo reconditionnés) à Nantes, Angers, Tours et Le Mans.',
        },
        {
          rubrique: 'Les salariés',
          contenu:
            '40 salariés : Nantes 16, Angers 10, Tours 8, Le Mans 6. Dont 10 alternants : 4, 3, 2 et 1.',
        },
        {
          rubrique: 'Les clients de septembre',
          contenu:
            '3 000 clients : Nantes 1 200, Angers 800, Tours 600, Le Mans 400.',
        },
        {
          rubrique: 'La carte Pass Partie',
          contenu:
            'Elle est détenue par 45 % des clients à Nantes, 60 % à Angers, 50 % à Tours et 75 % au Mans.',
        },
        {
          rubrique: 'La question d’Inès',
          contenu: '« Quelles parts, de quoi, pour le bilan ? »',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B1-01-A1-05-MISSION',
    titre: 'Votre mission : vérifier le bilan de rentrée',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['proportion', 'moyenne-ponderee'],
    notes: moteur.puces(
      'Lecture à voix haute (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Consigne orale : sans calculatrice. Enjeu : un bilan faux part chez l’expert-comptable sous le nom de l’alternant.',
      'Question 2 : faire dire « 40 % de quoi ? » ; c’est la page 2 de la trace écrite.',
      'Question 3 : ne pas trancher, c’est l’acte 2.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés, Nantes)',
      situation: [
        'Lundi, 9 h. Premier jour d’alternance chez Partie Libre.',
        'Inès Marchal, la gérante, prépare le bilan de rentrée pour l’expert-comptable : « Nous sommes 40 salariés, dont 10 alternants. Pouvez-vous vérifier les pourcentages du brouillon ? »',
        'Théo, responsable de la boutique de Nantes, a écrit : « Nantes emploie 40 % des alternants : 40 % des salariés de Nantes sont donc des alternants. »',
        'Pour la carte Pass Partie, Théo propose la moyenne des quatre boutiques.',
      ].join('\n'),
      geste: null,
      consequence: null,
      questionsLibres: [
        {
          id: 'b1-01-a1-mission:part',
          question:
            '10 alternants sur 40 salariés : quelle part, en % ? Comment l’avez-vous trouvée ?',
          placeholder: 'La part est de… parce que…',
        },
        {
          id: 'b1-01-a1-mission:theo',
          question:
            'La phrase de Théo est-elle juste ? De quel tout parle chaque pourcentage ?',
          placeholder: 'Juste / fausse : le premier 40 % parle de…',
        },
        {
          id: 'b1-01-a1-mission:carte',
          question:
            'Pour la carte, la moyenne des quatre pourcentages donne-t-elle la part des clients du réseau ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que les boutiques…',
        },
      ],
    },
  },
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A1-06-ILLUSTRATION-CLASSE',
      titre: 'Illustration : la classe de 25',
      concepts: ['proportion', 'pourcentage'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'classe-alternants.webp',
      imageAlt:
        'Infographie « Pour débuter : la classe de 25 ». Une classe de 25 étudiants, dont 10 en alternance, représentés par 25 silhouettes dont 10 colorées. La partie, 10 alternants, se divise par le tout, 25 étudiants : p = 10 ÷ 25 = 0,4, soit 40 %. Moyen mnémotechnique : partie en haut, tout en bas. Encadré : 60 % de la classe font 0,6 × 25 = 15 étudiants.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Avant de lire : « 10 sur 25, c’est plus ou moins de la moitié ? »',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A1-06-COURS-PROPORTION',
      titre: 'Cours : proportion et pourcentage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proportion', 'pourcentage'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : partie en haut, tout en bas.',
        'Lien au dossier : « 10 alternants sur 40 salariés : quel calcul ? »',
      ),
    },
    'lesson',
    {
      title: 'Proportion : la partie sur le tout',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'La partie sur le tout',
          text: 'Une proportion compare une partie à son tout.\nOn l’écrit en décimal ou en pourcentage.',
          formula:
            'p = partie ÷ total\npartie = p × total\ntotal = partie ÷ p\n0,4 = 40 %',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la classe de 25',
          text: '10 alternants dans une classe de 25 étudiants.',
          steps: [
            'p = 10 ÷ 25 = 0,4, soit 40 %.',
            '60 % de la classe : 0,6 × 25 = 15 étudiants.',
            '40 % font 10 étudiants : total = 10 ÷ 0,4 = 25.',
          ],
        },
        {
          kind: 'method',
          title: 'Partie en haut, tout en bas',
          text: 'Toujours la partie divisée par le tout.',
          steps: [
            'Repérer le tout, puis la partie.',
            '× 100 pour lire des % ; 4 % = 0,04.',
            'Contrôle : une part est entre 0 % et 100 %.',
          ],
        },
      ],
    },
  ),
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A1-07-ILLUSTRATION-PARMI',
      titre: 'Illustration : parmi qui ?',
      concepts: ['proportion', 'tableur'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'parmi-qui.webp',
      imageAlt:
        'Infographie « Parmi qui ? ». Un lycée de 800 élèves, dont 200 en STMG, dont 120 filles. Les 120 filles font 120 ÷ 200 = 60 % des élèves de STMG, mais 120 ÷ 800 = 15 % des élèves du lycée : même partie, autre tout, autre pourcentage. Le tout s’appelle la population de référence. Encart tableur : la part s’écrit =B2/$B$6, le total figé par des dollars.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Question : « Les 120 filles, c’est 60 % ou 15 % ? » Les deux : tout dépend du tout.',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A1-07-COURS-REFERENCE-TABLEUR',
      titre: 'Cours : population de référence et tableur',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proportion', 'tableur'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : « parmi qui ? » devant chaque pourcentage du dossier.',
        'Faire taper la formule sans $ sur un poste volontaire, puis la recopier : l’erreur fixe la règle.',
      ),
    },
    'lesson',
    {
      title: 'Population de référence : parmi qui ?',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Parmi qui ?',
          text: 'Le tout s’appelle la population de référence.\nChanger de tout change le pourcentage.',
          formula:
            '« 60 % des STMG » : tout = 200\n« 15 % des élèves » : tout = 800',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les filles de STMG',
          text: 'Un lycée de 800 élèves, dont 200 en STMG, dont 120 filles.',
          steps: [
            '120 ÷ 200 = 0,6 : 60 % des élèves de STMG sont des filles.',
            '120 ÷ 800 = 0,15 : 15 % des élèves du lycée sont des filles de STMG.',
          ],
        },
        {
          kind: 'method',
          title: 'Le tout ne bouge pas : $',
          text: 'Une formule de part, recopiée ; le total figé.',
          steps: [
            'Total en B6 : =SOMME(B2:B5).',
            'Part en C2 : =ARRONDI(B2/$B$6*100;1), recopiée.',
            'Sans $ : C3 lit B7, vide, et affiche #DIV/0!.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-01-A1-08-EXEMPLE-STOCK',
      titre: 'Exemple guidé : le stock d’Angers',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['proportion', 'tableur'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-01-a1-exemple-stock',
          enonce:
            'La boutique d’Angers a 250 jeux en stock : 90 jeux de plateau, 60 jeux de cartes et 100 jeux vidéo. 30 % des jeux de plateau sont des jeux d’ambiance.',
          etapes: [
            {
              id: 'part',
              intitule: 'La part des jeux de cartes',
              raisonnement: '60 ÷ 250 = 0,24, soit 24 % du stock.',
              invite: 'Quelle part du stock font les jeux de cartes ?',
            },
            {
              id: 'piege',
              intitule: 'Le sens de la division',
              raisonnement:
                '250 ÷ 60 ≈ 4,17, soit 417 % : impossible, une part ne dépasse pas 100 %. C’est le tout divisé par la partie.',
              invite: 'Que donnerait 250 ÷ 60 ? Pourquoi est-ce faux ?',
            },
            {
              id: 'partie',
              intitule: 'Une partie d’après sa part',
              raisonnement: '0,30 × 90 = 27 jeux d’ambiance.',
              invite: 'Combien y a-t-il de jeux d’ambiance ?',
            },
            {
              id: 'reference',
              intitule: 'Parmi qui ?',
              raisonnement:
                '27 jeux font 30 % des jeux de plateau, mais 27 ÷ 250 = 0,108, soit 10,8 % du stock.',
              invite: 'Quelle part du stock font les jeux d’ambiance ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                'Total en B5 : =SOMME(B2:B4). Part en C2 : =ARRONDI(B2/$B$5*100;1), recopiée.',
              invite:
                'Quantités en B2 à B4 : quelles formules pour le total et la part, recopiable ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le sens de la division (étape 2) et sur le changement de tout (étape 4).',
        'Transition : « À vous, sur les salariés de Partie Libre : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A1-09-ATELIER-ALTERNANTS',
      titre: 'Exercice 1 — Les alternants du réseau',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['proportion', 'pourcentage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : souligner le tout de chaque question avant de calculer.',
        'Pièges : tout divisé par la partie ; 0,25 écrit pour 25 % ; mauvais tout.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 1 — Les alternants du réseau',
        consigne:
          '40 salariés, dont 10 alternants. Nantes : 16 salariés, dont 4 alternants. Résultats en %.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-01-a1-part-alternants',
            'proportion',
            'Quelle part des salariés du réseau sont des alternants ?',
            '%',
            enPourcentage(ALTERNANTS, SALARIES),
            moteur.UNE_DECIMALE,
            '25 %',
            [
              [enPourcentage(SALARIES, ALTERNANTS), BASE_INVERSEE],
              [ALTERNANTS / SALARIES, FACTEUR_CENT],
            ],
          ),
          moteur.vote(
            'b1-01-a1-phrase-theo',
            'proportion',
            true,
            '4 des 10 alternants travaillent à Nantes. Quelle phrase est juste ?',
            '40 % des alternants du réseau travaillent à Nantes',
            [['40 % des salariés de Nantes sont des alternants', MAUVAIS_TOUT]],
          ),
          moteur.numerique(
            'b1-01-a1-alternants-nantes',
            'proportion',
            'Quelle part des salariés de Nantes sont des alternants ?',
            '%',
            enPourcentage(ALTERNANTS_DE_NANTES, SALARIES_DE_NANTES),
            moteur.UNE_DECIMALE,
            '25 %',
            [
              [enPourcentage(ALTERNANTS_DE_NANTES, ALTERNANTS), MAUVAIS_TOUT],
              [enPourcentage(ALTERNANTS_DE_NANTES, SALARIES), MAUVAIS_TOUT],
            ],
          ),
          moteur.numerique(
            'b1-01-a1-objectif',
            'proportion',
            'Inès vise 30 % d’alternants parmi les 40 salariés. Combien d’alternants faudrait-il ?',
            'alternants',
            OBJECTIF_D_ALTERNANCE * SALARIES,
            moteur.TOLERANCE_NULLE,
            '12 alternants',
            [
              [OBJECTIF_D_ALTERNANCE * ALTERNANTS, MAUVAIS_TOUT],
              [OBJECTIF_D_ALTERNANCE * 100, VALEUR_POUR_TAUX],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Faisons calculer toutes les parts par le tableur : exercice 2. »',
      ],
    },
    [
      [
        'b1-01-a1-part-alternants',
        '10 ÷ 40 = 0,25, soit 25 %. 40 ÷ 10 = 4 donnerait 400 % : le tout divisé par la partie.',
      ],
      [
        'b1-01-a1-phrase-theo',
        '4 ÷ 10 = 0,4 : 40 % des alternants. Le tout, ce sont les 10 alternants du réseau, pas les salariés de Nantes.',
      ],
      [
        'b1-01-a1-alternants-nantes',
        '4 ÷ 16 = 0,25 : 25 % des salariés de Nantes, pas 40 %. Théo s’est trompé de tout.',
      ],
      [
        'b1-01-a1-objectif',
        '0,30 × 40 = 12 alternants. 30 % des 10 alternants donnerait 3 : le mauvais tout.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A1-10-TABLEUR-CLIENTS',
      titre: 'Exercice 2 — La répartition des clients au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 7,
      concepts: ['tableur', 'proportion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 5),
        'Réflexion : écrire sur papier la formule de C2, puis ce qu’elle devient en C3 une fois recopiée.',
        'Erreurs à chercher : B6 sans $ (#DIV/0! dès C3) ; total tapé au clavier ; part sans × 100 ; ARRONDI oublié.',
        'Papier : formules écrites sur la copie, puis les parts à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: REPARTITION_DES_CLIENTS.plan,
        questions: [
          moteur.questionDeFeuille(
            REPARTITION_DES_CLIENTS.plan,
            REPARTITION_DES_CLIENTS.attendus,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_PREMIERE_PAUSE,
    [
      [
        'B6',
        `${REPARTITION_DES_CLIENTS.formules.total} : 3 000 clients. Tapé au clavier, le total ne suivrait pas un changement de chiffre.`,
      ],
      [
        'C2 à C5',
        `${REPARTITION_DES_CLIENTS.formules.part}, recopiée : 40 ; 26,7 ; 20 ; 13,3. Sans les $, C3 lit B7, vide : #DIV/0!. Sans ARRONDI, 26,666… n’est pas arrondi au dixième.`,
      ],
      [
        'C6',
        `${REPARTITION_DES_CLIENTS.formules.controle} : 100. Les parts d’un tout font toujours 100 %.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-01-A1-11-JALON',
      titre: 'Jalon 1 : la part d’un tout',
      concepts: ['proportion', 'tableur'],
    },
    {
      id: 'b1-01-a1-jalon',
      invite:
        'Je sais calculer une part, dire de quel tout elle parle et l’écrire au tableur.',
    },
    'Si plus de 30 % « Perdu » : reprendre la page A1-07 sur le tout, après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B1-01-A2-01-REFLEXION-CARTE',
      titre: 'Réfléchir : la carte et la réservation en ligne',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['proportion'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Les porteurs de la carte sont-ils plus ou moins nombreux que les clients ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b1-01-a2-reflexion-carte',
        type: 'reflection',
        question:
          'À Nantes, 45 % des 1 200 clients ont la carte Pass Partie. Parmi eux, 40 % réservent leur table en ligne. Théo écrit : « 40 % des clients de Nantes réservent en ligne avec la carte. » Sans calculatrice : a-t-il raison ? De quel tout parle chaque pourcentage ?',
        placeholder:
          'Il a raison / tort, parce que le second pourcentage porte sur…',
        competency: 'Raisonner · nommer la population de référence',
      },
    },
    {
      correction: {
        expected:
          'Il a tort : 40 % porte sur les porteurs de la carte, pas sur tous les clients. Part des clients : 0,45 × 0,40 = 0,18, soit 18 %, 216 clients.',
        nextAction:
          'Gardez votre réponse : la trace écrite multiplie les deux parts.',
      },
      renvoi: RENVOI_AU_DOSSIER,
    },
  ),
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A2-02-ILLUSTRATION-SALLE',
      titre: 'Illustration : la part d’une part',
      concepts: ['proportion'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'salle-de-spectacle.webp',
      imageAlt:
        'Infographie « La part d’une part ». Une salle de 200 spectateurs : 30 % ont moins de 18 ans, soit 60 ; parmi eux, 40 % ont une place gratuite, soit 24. Part de la salle : 0,30 × 0,40 = 0,12, soit 12 %, et 24 ÷ 200 = 0,12. L’addition 30 % + 40 % = 70 % est barrée. Moyen mnémotechnique : parmi, je multiplie.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Question : « Les 40 %, ce sont 40 % de qui ? » Des moins de 18 ans, pas de la salle.',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A2-02-COURS-PROPORTION-DE-PROPORTION',
      titre: 'Cours : proportion de proportion',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proportion'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Question : « 30 % + 40 % = 70 % de la salle ? » Non : il n’y a que 24 personnes.',
        'Faire répéter le moyen mnémotechnique : « parmi », je multiplie.',
      ),
    },
    'lesson',
    {
      title: 'Proportion de proportion : une partie d’une partie',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une partie d’une partie',
          text: 'La part d’une part se calcule en multipliant.\nLe résultat se rapporte au plus grand tout.',
          formula: 'part dans le tout = p₁ × p₂',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la salle de spectacle',
          text: '200 spectateurs : 30 % ont moins de 18 ans, et 40 % d’entre eux ont une place gratuite.',
          steps: [
            'Moins de 18 ans : 0,30 × 200 = 60.',
            'Places gratuites : 0,40 × 60 = 24.',
            '0,30 × 0,40 = 0,12 : 12 % de la salle, soit 24 ÷ 200.',
          ],
        },
        {
          kind: 'method',
          title: '« Parmi » → je multiplie',
          text: 'Deux parts emboîtées : on les multiplie, jamais on ne les additionne.',
          steps: [
            'Écrire les deux parts en décimal.',
            'Multiplier : p₁ × p₂.',
            'Contrôle : le résultat est plus petit que chaque part.',
          ],
        },
      ],
    },
  ),
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A2-03-ILLUSTRATION-DEUX-CLASSES',
      titre: 'Illustration : deux classes, un taux',
      concepts: ['moyenne-ponderee'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'deux-classes.webp',
      imageAlt:
        'Infographie « Deux classes, un taux ». Classe A : 20 élèves, 50 % reçus, soit 10 ; classe B : 30 élèves, 80 % reçus, soit 24. Taux global : 34 reçus sur 50 élèves, soit 68 %. La moyenne simple des deux taux, 65 %, est barrée : la classe B, plus nombreuse, pèse plus. Moyen mnémotechnique : des personnes, pas des pourcentages.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Question : « Pourquoi pas 65 % ? » La classe B, plus nombreuse, pèse plus.',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A2-03-COURS-TAUX-GLOBAL',
      titre: 'Cours : taux global et moyenne pondérée',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['moyenne-ponderee'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : des personnes, pas des pourcentages.',
        'Relier à la question 3 de la mission : la moyenne de Théo.',
      ),
    },
    'lesson',
    {
      title: 'Taux global : la moyenne pondérée',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Un taux pour tout le groupe',
          text: 'Le taux global se calcule sur les personnes, pas sur les taux.\nC’est la moyenne des taux pondérée par les effectifs.',
          formula:
            'taux global = concernés ÷ effectif total\n= (n₁ × t₁ + n₂ × t₂) ÷ (n₁ + n₂)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : deux classes',
          text: 'Classe A : 20 élèves, 50 % reçus. Classe B : 30 élèves, 80 % reçus.',
          steps: [
            'Reçus : 0,5 × 20 = 10 et 0,8 × 30 = 24.',
            'Taux global : 34 ÷ 50 = 0,68, soit 68 %.',
            'La moyenne simple, 65 %, oublie que la classe B est plus grande.',
          ],
        },
        {
          kind: 'method',
          title: 'Des personnes, pas des pourcentages',
          text: 'On compte les concernés, puis on divise.',
          steps: [
            'Concernés de chaque groupe : n × t.',
            'Additionner les concernés, puis les effectifs.',
            'Contrôle : le taux global est plus près de celui du plus gros groupe.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-01-A2-04-EXEMPLE-SOIREES',
      titre: 'Exemple guidé : les soirées jeux de Tours',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['moyenne-ponderee', 'proportion'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-01-a2-exemple-soirees',
          enonce:
            'Tours organise deux soirées jeux : mardi, 50 joueurs dont 40 % de nouveaux ; vendredi, 150 joueurs dont 20 % de nouveaux. Parmi tous les nouveaux, 60 % reviennent la semaine suivante.',
          etapes: [
            {
              id: 'mardi',
              intitule: 'Les nouveaux du mardi',
              raisonnement: '0,40 × 50 = 20 nouveaux.',
              invite: 'Combien de nouveaux joueurs le mardi ?',
            },
            {
              id: 'vendredi',
              intitule: 'Les nouveaux du vendredi',
              raisonnement: '0,20 × 150 = 30 nouveaux.',
              invite: 'Combien de nouveaux joueurs le vendredi ?',
            },
            {
              id: 'global',
              intitule: 'Le taux global',
              raisonnement:
                '50 nouveaux sur 200 joueurs : 50 ÷ 200 = 0,25, soit 25 %.',
              invite:
                'Quelle part des joueurs des deux soirées sont nouveaux ?',
            },
            {
              id: 'piege',
              intitule: 'La moyenne simple',
              raisonnement:
                '(40 + 20) ÷ 2 = 30 % : trop haut. Le vendredi, trois fois plus fréquenté, pèse trois fois plus.',
              invite:
                'Que donnerait la moyenne des deux taux ? Pourquoi est-ce faux ?',
            },
            {
              id: 'reviennent',
              intitule: 'Une part d’une part',
              raisonnement:
                '0,25 × 0,60 = 0,15 : 15 % des joueurs reviennent, soit 30 joueurs.',
              invite:
                'Quelle part de tous les joueurs revient la semaine suivante ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la moyenne simple (étape 4) et sur la part d’une part (étape 5).',
        'Transition : « À vous, sur la carte Pass Partie : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A2-05-TABLEAU-FIDELITE',
      titre: 'Exercice 3 — Le taux de fidélité du réseau',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 6,
      concepts: ['moyenne-ponderee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : dire en français ce qu’on saisit : des personnes, pas des pourcentages.',
        'Pièges : le taux saisi tel quel ; les clients divisés par le taux.',
        'Papier : tableau du livret, rempli à la main.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_AU_DOSSIER,
        plan: {
          id: 'b1-01-a2-tableau-fidelite',
          intitule: 'Le taux de fidélité des quatre boutiques',
          consignes: [
            'Pour chaque boutique, saisissez le nombre de porteurs de la carte : clients × taux.',
            'Le total et le taux global se calculent seuls à partir de vos saisies.',
          ],
          echeances: BOUTIQUES.length,
          intituleDesLignes: 'Boutique',
          libellesLignes: [...BOUTIQUES],
          parametres: {},
          colonnes: [
            {
              cle: 'clients',
              intitule: 'Clients en septembre',
              role: 'donnee',
              valeurs: [...CLIENTS],
              decimales: 0,
              totalise: true,
            },
            {
              cle: 'taux',
              intitule: 'Clients avec la carte (%)',
              role: 'donnee',
              valeurs: [...TAUX_DE_LA_CARTE],
              decimales: 0,
              totalise: false,
            },
            {
              cle: 'porteurs',
              intitule: 'Porteurs de la carte',
              role: 'saisie',
              decimales: 0,
              totalise: true,
            },
          ],
          synthese: [
            {
              libelle: 'Taux global de fidélité du réseau',
              formule: 'totalPorteurs / totalClients * 100',
              unite: '%',
              decimales: 1,
            },
          ],
        },
        questions: [
          moteur.questionDeTableau(
            'b1-01-a2-tableau-fidelite',
            'moyenne-ponderee',
            [PREMIERS_PORTEURS, ...AUTRES_PORTEURS],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste ; comparer le taux global, 54 %, à la moyenne des quatre taux, 57,5 %.',
        'Transition : « Le taux global est trouvé : exercice 4. »',
      ],
    },
    [
      [
        'b1-01-a2-tableau-fidelite',
        `Porteurs : 540 ; 480 ; 300 ; 300, soit ${TOTAL_DES_PORTEURS} sur ${TOTAL_DES_CLIENTS} clients. Taux global : 1 620 ÷ 3 000 = 54 %. La moyenne des quatre taux, 57,5 %, oublie que Nantes a le plus de clients.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A2-06-ATELIER-FIDELITE',
      titre: 'Exercice 4 — Fidélité et réservations',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['moyenne-ponderee', 'proportion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : pour chaque question, écrire « parmi qui ? » avant de calculer.',
        'Pièges : taux additionnés ; moyenne simple ; mauvais tout.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 4 — Fidélité et réservations',
        consigne:
          'Réseau : 3 000 clients, dont 54 % avec la carte. Parmi les porteurs de la carte, 40 % réservent leur table en ligne.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b1-01-a2-poids',
            'moyenne-ponderee',
            true,
            'Le taux global, 54 %, est plus bas que la moyenne des quatre taux, 57,5 %. Pourquoi ?',
            'Nantes, la boutique qui a le plus de clients, a le taux le plus bas : il pèse le plus',
            [
              [
                'La moyenne des quatre taux est le bon calcul : 54 % est une erreur',
                MOYENNE_SIMPLE,
              ],
            ],
          ),
          moteur.numerique(
            'b1-01-a2-part-reservation',
            'proportion',
            'Quelle part des clients du réseau a la carte et réserve en ligne ?',
            '%',
            enPourcentage(
              TOTAL_DES_PORTEURS * RESERVATION_EN_LIGNE,
              TOTAL_DES_CLIENTS,
            ),
            moteur.UNE_DECIMALE,
            '21,6 %',
            [
              [RESERVATION_EN_LIGNE * 100, MAUVAIS_TOUT],
              [
                enPourcentage(TOTAL_DES_PORTEURS, TOTAL_DES_CLIENTS) +
                  RESERVATION_EN_LIGNE * 100,
                ADDITIF,
              ],
            ],
          ),
          moteur.numerique(
            'b1-01-a2-clients-reservation',
            'proportion',
            'Combien de clients du réseau ont la carte et réservent en ligne ?',
            'clients',
            TOTAL_DES_PORTEURS * RESERVATION_EN_LIGNE,
            moteur.TOLERANCE_NULLE,
            '648 clients',
            [
              [TOTAL_DES_CLIENTS * RESERVATION_EN_LIGNE, MAUVAIS_TOUT],
              [TOTAL_DES_PORTEURS, MAUVAIS_TOUT],
            ],
          ),
          moteur.numerique(
            'b1-01-a2-octobre',
            'moyenne-ponderee',
            'En octobre, Nantes compte 1 500 clients dont 40 % de porteurs, Angers 500 dont 70 %. Quel est le taux global de porteurs des deux boutiques ?',
            '%',
            enPourcentage(
              CLIENTS_D_OCTOBRE[0] * TAUX_D_OCTOBRE[0] +
                CLIENTS_D_OCTOBRE[1] * TAUX_D_OCTOBRE[1],
              CLIENTS_D_OCTOBRE[0] + CLIENTS_D_OCTOBRE[1],
            ),
            moteur.UNE_DECIMALE,
            '47,5 %',
            [
              [
                ((TAUX_D_OCTOBRE[0] + TAUX_D_OCTOBRE[1]) / 2) * 100,
                MOYENNE_SIMPLE,
              ],
              [(TAUX_D_OCTOBRE[0] + TAUX_D_OCTOBRE[1]) * 100, ADDITIF],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [moteur.CORRIGER_PAR_LA_MOINS_REUSSIE, 'Transition : jalon 2.'],
    },
    [
      [
        'b1-01-a2-poids',
        'Le taux global compte des personnes : Nantes, 1 200 clients à 45 %, tire le taux vers le bas.',
      ],
      [
        'b1-01-a2-part-reservation',
        '0,54 × 0,40 = 0,216, soit 21,6 %. 40 % porte sur les porteurs, pas sur tous les clients ; 54 + 40 = 94 % additionne les parts.',
      ],
      [
        'b1-01-a2-clients-reservation',
        '0,216 × 3 000 = 648 clients, soit 40 % des 1 620 porteurs. 40 % des 3 000 clients donnerait 1 200 : le mauvais tout.',
      ],
      [
        'b1-01-a2-octobre',
        '(0,40 × 1 500 + 0,70 × 500) ÷ 2 000 = 950 ÷ 2 000 = 0,475, soit 47,5 %. La moyenne simple, 55 %, oublie que Nantes est trois fois plus grande.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-01-A2-07-JALON',
      titre: 'Jalon 2 : la part d’une part, le taux global',
      concepts: ['proportion', 'moyenne-ponderee'],
    },
    {
      id: 'b1-01-a2-jalon',
      invite:
        'Je sais multiplier deux parts et calculer un taux global avec les effectifs.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple des deux classes de la trace écrite A2-03.',
  ),
];

const ACTE_3: moteur.Acte = [
  {
    screenId: 'B1-01-A3-01-VOTE-POURCENTAGES',
    titre: 'Vote : de quel pourcentage parle-t-on ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['point-de-pourcentage', 'pourcentage'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-01-a3-points',
          'point-de-pourcentage',
          false,
          'La part des ventes en ligne de Partie Libre passe de 18 % à 24 % du chiffre d’affaires. Quelle phrase est juste ?',
          'Elle gagne 6 points',
          [['Elle augmente de 6 %', POINTS_POUR_POURCENTAGE]],
        ),
        moteur.vote(
          'b1-01-a3-marque',
          'pourcentage',
          false,
          'Une console achetée 150 € HT est revendue 240 € HT. La marge, 90 €, représente quel pourcentage du prix de vente ?',
          '37,5 %',
          [['60 %', MARQUE_POUR_MARGE]],
        ),
      ],
    },
  },
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A3-02-ILLUSTRATION-CODE',
      titre: 'Illustration : points ou pourcentage ?',
      concepts: ['point-de-pourcentage', 'taux-evolution'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'code-de-la-route.webp',
      imageAlt:
        'Infographie « Points ou pourcentage ? ». Le taux de réussite au code passe de 60 % en 2025 à 66 % en 2026 : l’écart est de 66 − 60 = 6 points. En évolution, (66 − 60) ÷ 60 = 0,10, soit + 10 %. L’écriture « + 6 % » est barrée. Moyen mnémotechnique : deux pourcentages qu’on soustrait, ce sont des points.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Question : « De 60 % à 66 %, + 6 % ou + 10 % ? » Laisser venir les deux réponses avant de lire.',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A3-02-COURS-POINTS',
      titre: 'Cours : proportion, évolution et points',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['point-de-pourcentage', 'taux-evolution'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier au diagnostic A1-03 : une évolution se divise par la valeur de départ.',
        'Faire répéter le moyen mnémotechnique : deux % qu’on soustrait, ce sont des points.',
        'Les évolutions reviennent au B1-02.',
      ),
    },
    'lesson',
    {
      title: 'Une part ou une évolution ? Les points',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une part ou une évolution ?',
          text: 'Une proportion compare à un tout ; une évolution, à une valeur de départ.\nL’écart de deux pourcentages se dit en points.',
          formula:
            'écart = p₂ − p₁, en points\ntaux d’évolution = (V₂ − V₁) ÷ V₁',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le code de la route',
          text: 'Taux de réussite au code : 60 % en 2025, 66 % en 2026.',
          steps: [
            'Écart : 66 − 60 = + 6 points.',
            'En évolution : 6 ÷ 60 = 0,10, soit + 10 %.',
          ],
        },
        {
          kind: 'method',
          title: 'Deux % qu’on soustrait : des points',
          text: 'Lire le mot qui accompagne le pourcentage.',
          steps: [
            '« Part de, parmi » : une proportion.',
            '« Hausse, baisse, par rapport à » : une évolution.',
            'Jamais « + 6 % » pour + 6 points.',
          ],
        },
      ],
    },
  ),
  moteur.ecranDIllustration(
    {
      screenId: 'B1-01-A3-03-ILLUSTRATION-ETIQUETTE',
      titre: 'Illustration : une marge, deux taux',
      concepts: ['pourcentage'],
    },
    DOSSIER_DES_ILLUSTRATIONS,
    {
      fichier: 'etiquette-marge-marque.webp',
      imageAlt:
        'Infographie « Une marge, deux taux ». Un tee-shirt acheté 10 € HT et vendu 25 € HT : la marge est de 15 €. Taux de marge : 15 ÷ 10 = 150 %, la marge rapportée au coût d’achat. Taux de marque : 15 ÷ 25 = 60 %, la marge rapportée au prix de vente. Moyen mnémotechnique : la marque se lit sur l’étiquette, celle du prix de vente.',
    },
    [
      moteur.AVANT_SA_PAGE,
      'Question : « 15 € de marge : 150 % ou 60 % ? » Les deux, selon le prix par lequel on divise.',
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-01-A3-03-COURS-MARGE-MARQUE',
      titre: 'Cours : taux de marge et taux de marque',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['pourcentage'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : la marque se lit sur l’étiquette.',
        'Lien au dossier : « La console à 150 € et 240 € : quel taux voit le client ? »',
      ),
    },
    'lesson',
    {
      title: 'Une marge, deux taux',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Taux de marge, taux de marque',
          text: 'Marge = prix de vente HT − coût d’achat HT.\nOn la rapporte au coût d’achat (marge) ou au prix de vente (marque).',
          formula:
            'taux de marge = marge ÷ coût d’achat HT\ntaux de marque = marge ÷ prix de vente HT',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le tee-shirt',
          text: 'Un tee-shirt acheté 10 € HT, vendu 25 € HT.',
          steps: [
            'Marge : 25 − 10 = 15 €.',
            'Taux de marge : 15 ÷ 10 = 1,5, soit 150 %.',
            'Taux de marque : 15 ÷ 25 = 0,6, soit 60 %.',
          ],
        },
        {
          kind: 'method',
          title: 'La marque se lit sur l’étiquette',
          text: 'L’étiquette, c’est le prix de vente : la marque divise par lui.',
          steps: [
            'Taux de marge : ÷ coût d’achat.',
            'Taux de marque : ÷ prix de vente.',
            'Contrôle : le taux de marque est plus petit que le taux de marge.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-01-A3-04-EXEMPLE-JEU',
      titre: 'Exemple guidé : un jeu de société à 36 €',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['pourcentage', 'point-de-pourcentage'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-01-a3-exemple-jeu',
          enonce:
            'Partie Libre achète un jeu de société 24 € HT et le revend 36 € HT. Les jeux de société passent de 30 % à 35 % du chiffre d’affaires.',
          etapes: [
            {
              id: 'marge',
              intitule: 'La marge',
              raisonnement: '36 − 24 = 12 €.',
              invite: 'Quelle est la marge sur un jeu ?',
            },
            {
              id: 'taux-de-marge',
              intitule: 'Le taux de marge',
              raisonnement: '12 ÷ 24 = 0,5, soit 50 %.',
              invite: 'Calculez le taux de marge.',
            },
            {
              id: 'taux-de-marque',
              intitule: 'Le taux de marque',
              raisonnement: '12 ÷ 36 ≈ 0,333, soit 33,3 %.',
              invite: 'Calculez le taux de marque.',
            },
            {
              id: 'prix',
              intitule: 'Un prix pour 60 % de marge',
              raisonnement: '24 + 0,60 × 24 = 24 × 1,6 = 38,40 € HT.',
              invite:
                'À quel prix HT vendre le jeu pour un taux de marge de 60 % ?',
            },
            {
              id: 'points',
              intitule: 'Points ou pourcentage',
              raisonnement:
                '35 − 30 = + 5 points ; en évolution, 5 ÷ 30 ≈ + 16,7 %.',
              invite:
                'La part des jeux de société : combien de points de plus ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le diviseur de chaque taux (étapes 2 et 3) et sur les points (étape 5).',
        'Transition : « À vous : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-01-A3-05-ATELIER-VENTES',
      titre: 'Exercice 5 — Jeunes clients et manettes',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['point-de-pourcentage', 'taux-evolution', 'pourcentage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire « proportion », « évolution » ou « marge, marque » devant chaque question.',
        'Pièges : points écrits en % ; évolution divisée par l’arrivée ; marge et marque inversées.',
        'Papier : exercice 5 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — Jeunes clients et manettes',
        consigne:
          'Part des moins de 25 ans parmi les clients : 36,5 % en 2025, 42,3 % en 2026. Une manette reconditionnée est achetée 24 € HT et vendue 39 € HT. Résultats arrondis au dixième.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-01-a3-ecart-points',
            'point-de-pourcentage',
            'De combien de points la part des moins de 25 ans a-t-elle augmenté ?',
            'points',
            ECART_DES_JEUNES,
            moteur.UNE_DECIMALE,
            '5,8 points',
            [
              [
                enPourcentage(ECART_DES_JEUNES, PART_DES_JEUNES_2025),
                POINTS_POUR_POURCENTAGE,
              ],
            ],
          ),
          moteur.numerique(
            'b1-01-a3-evolution',
            'taux-evolution',
            'Quel est le taux d’évolution de la part des moins de 25 ans ?',
            '%',
            enPourcentage(ECART_DES_JEUNES, PART_DES_JEUNES_2025),
            moteur.UNE_DECIMALE,
            '15,9 %',
            [
              [ECART_DES_JEUNES, POINTS_POUR_POURCENTAGE],
              [
                enPourcentage(ECART_DES_JEUNES, PART_DES_JEUNES_2026),
                'base-arrivee',
              ],
            ],
          ),
          moteur.numerique(
            'b1-01-a3-taux-de-marge',
            'pourcentage',
            'Quel est le taux de marge de la manette ?',
            '%',
            enPourcentage(
              VENTE_DE_LA_MANETTE - ACHAT_DE_LA_MANETTE,
              ACHAT_DE_LA_MANETTE,
            ),
            moteur.UNE_DECIMALE,
            '62,5 %',
            [
              [
                enPourcentage(
                  VENTE_DE_LA_MANETTE - ACHAT_DE_LA_MANETTE,
                  VENTE_DE_LA_MANETTE,
                ),
                MARQUE_POUR_MARGE,
              ],
            ],
          ),
          moteur.numerique(
            'b1-01-a3-taux-de-marque',
            'pourcentage',
            'Quel est le taux de marque de la manette ?',
            '%',
            enPourcentage(
              VENTE_DE_LA_MANETTE - ACHAT_DE_LA_MANETTE,
              VENTE_DE_LA_MANETTE,
            ),
            moteur.UNE_DECIMALE,
            '38,5 %',
            [
              [
                enPourcentage(
                  VENTE_DE_LA_MANETTE - ACHAT_DE_LA_MANETTE,
                  ACHAT_DE_LA_MANETTE,
                ),
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
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Transition : « Faisons le point : points, marge et marque. »',
      ],
    },
    [
      [
        'b1-01-a3-ecart-points',
        '42,3 − 36,5 = 5,8 points. Écrire « 15,9 % » donnerait l’évolution, pas l’écart.',
      ],
      [
        'b1-01-a3-evolution',
        '(42,3 − 36,5) ÷ 36,5 ≈ 0,159, soit + 15,9 %. Diviser par 42,3 donnerait 13,7 % : on divise par la valeur de départ.',
      ],
      [
        'b1-01-a3-taux-de-marge',
        'Marge : 39 − 24 = 15 €. Taux de marge : 15 ÷ 24 = 0,625, soit 62,5 %.',
      ],
      [
        'b1-01-a3-taux-de-marque',
        'Taux de marque : 15 ÷ 39 ≈ 0,385, soit 38,5 %. Plus petit que le taux de marge : on divise par le prix de vente, plus grand.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-01-A3-07-JALON',
      titre: 'Jalon 3 : points, marge et marque',
      concepts: ['point-de-pourcentage', 'pourcentage'],
    },
    {
      id: 'b1-01-a3-jalon',
      invite:
        'Je sais écrire un écart en points et calculer un taux de marge et un taux de marque.',
    },
    moteur.PAUSE_HORS_DUREE,
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [BASE_INVERSEE]: 'B1-01-A1-06-COURS-PROPORTION',
  [FACTEUR_CENT]: 'B1-01-A1-06-COURS-PROPORTION',
  [VALEUR_POUR_TAUX]: 'B1-01-A1-06-COURS-PROPORTION',
  [MAUVAIS_TOUT]: 'B1-01-A1-07-COURS-REFERENCE-TABLEUR',
  [NON_FIGEE]: 'B1-01-A1-07-COURS-REFERENCE-TABLEUR',
  'valeur-saisie-sans-formule': 'B1-01-A1-07-COURS-REFERENCE-TABLEUR',
  [ARRONDI_OUBLIE]: 'B1-01-A1-07-COURS-REFERENCE-TABLEUR',
  [ADDITIF]: 'B1-01-A2-02-COURS-PROPORTION-DE-PROPORTION',
  [MOYENNE_SIMPLE]: 'B1-01-A2-03-COURS-TAUX-GLOBAL',
  [POINTS_POUR_POURCENTAGE]: 'B1-01-A3-02-COURS-POINTS',
  [PART_POUR_EVOLUTION]: 'B1-01-A3-02-COURS-POINTS',
  'ecart-absolu-au-lieu-du-taux': 'B1-01-A3-02-COURS-POINTS',
  'base-arrivee': 'B1-01-A3-02-COURS-POINTS',
  [MARQUE_POUR_MARGE]: 'B1-01-A3-03-COURS-MARGE-MARQUE',
};

const ILLUSTRATIONS = [
  ['M1', 'classe-alternants.webp', 'Pour débuter : la classe de 25'],
  ['M2', 'parmi-qui.webp', 'Parmi qui ?'],
  ['M3', 'salle-de-spectacle.webp', 'La part d’une part'],
  ['M4', 'deux-classes.webp', 'Deux classes, un taux'],
  ['M5', 'code-de-la-route.webp', 'Points ou pourcentage ?'],
  ['M6', 'etiquette-marge-marque.webp', 'Une marge, deux taux'],
] as const;

const MEDIAS = moteur.mediasDesIllustrations(
  DOSSIER_DES_ILLUSTRATIONS,
  ILLUSTRATIONS,
  GRAVURE_DE_L_ACCROCHE,
);

export const COURS_B1_01 = moteur.coursB1(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  MEDIAS,
  {
    slug: 'b1-01-proportions-pourcentages',
    titre: 'Proportions et pourcentages',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
