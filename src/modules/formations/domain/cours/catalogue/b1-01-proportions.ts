import type { Cours } from '../Cours';
import { questionNumerique, questionVote } from '../Cours';

const QUESTION_RAPPEL_PROPORTION = questionVote({
  id: 'B1-01-RAPPEL-PROPORTION',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({}),
  enonce: () =>
    'Dans une situation proportionnelle, si une grandeur est multipliée par 3, l’autre grandeur est :',
  bonne: () => 'multipliée par 3 également',
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'augmentée d’une valeur fixe',
    },
  ],
});

const QUESTION_NUM_TAUX_EVOLUTION = questionNumerique({
  id: 'B1-01-NUM-TAUX-EVOLUTION',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (tirage) => {
    const depart = tirage.entier(150, 900);
    const hausse = tirage.entier(15, 60);
    const arrivee = Math.round(depart * (1 + hausse / 100));
    return { depart, arrivee };
  },
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires d’une entreprise passe de ${depart} € à ${arrivee} €. Quel est le taux d’évolution, en pourcentage ?`,
  unite: '%',
  solution: ({ depart, arrivee }) => ((arrivee - depart) / depart) * 100,
  tolerance: { type: 'absolue', valeur: 0.1 },
  pieges: [
    {
      confusion: 'base-arrivee',
      valeur: ({ depart, arrivee }) => ((arrivee - depart) / arrivee) * 100,
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      valeur: ({ depart, arrivee }) => arrivee - depart,
    },
  ],
});

const QUESTION_QUESTIONNAIRE_COEFFICIENT = questionNumerique({
  id: 'B1-01-QUESTIONNAIRE-COEFFICIENT',
  concept: 'coefficient-multiplicateur',
  noteCompte: true,
  donnees: (tirage) => ({
    depart: tirage.entier(100, 900),
    tauxPourcent: tirage.entier(5, 40),
  }),
  enonce: ({ depart, tauxPourcent }) =>
    `Un prix de ${depart} € est majoré par un coefficient multiplicateur correspondant à une hausse de ${tauxPourcent} %. Quel est le nouveau prix ?`,
  unite: '€',
  solution: ({ depart, tauxPourcent }) => depart * (1 + tauxPourcent / 100),
  tolerance: { type: 'absolue', valeur: 0.01 },
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ depart, tauxPourcent }) => depart * tauxPourcent,
    },
  ],
});

const QUESTION_QUESTIONNAIRE_PROPORTION = questionVote({
  id: 'B1-01-QUESTIONNAIRE-PROPORTION',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({}),
  enonce: () =>
    'Un fournisseur double la quantité livrée, à prix unitaire inchangé. Le montant total de la facture est :',
  bonne: () => 'doublé lui aussi',
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'augmenté d’un montant fixe, quelle que soit la quantité',
    },
  ],
});

const QUESTION_EXIT_TAUX = questionVote({
  id: 'B1-01-EXIT-TAUX',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: () => ({}),
  enonce: () =>
    'Pour calculer un taux d’évolution entre un prix de départ et un prix d’arrivée, on divise l’écart par :',
  bonne: () => 'la valeur de départ',
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: () => 'la valeur d’arrivée',
    },
  ],
});

export const B1_01_PROPORTIONS: Cours = {
  slug: 'b1-01-proportions',
  titre: 'Proportions, taux et évolutions',
  niveau: 'BTS CG 2',
  dureeMinutes: 42,
  concepts: ['proportion', 'taux-evolution', 'coefficient-multiplicateur'],
  ecrans: [
    {
      id: 'E-RECALL',
      brique: 'fp-recall',
      dureeMinutes: 5,
      concepts: ['proportion'],
      notes:
        'Réactiver la notion de proportionnalité avant d’attaquer les taux.',
      question: QUESTION_RAPPEL_PROPORTION,
    },
    {
      id: 'E-QUOTE',
      brique: 'fp-quote',
      dureeMinutes: 3,
      concepts: ['proportion'],
      notes: 'Accroche : ancrer l’enjeu métier des pourcentages.',
      proprietes: {
        texte:
          'Un pourcentage mal interprété coûte souvent plus cher qu’une erreur de calcul.',
        auteur: null,
        source: null,
      },
    },
    {
      id: 'E-NUM',
      brique: 'fp-numeric',
      dureeMinutes: 6,
      concepts: ['taux-evolution'],
      notes:
        'Calcul guidé d’un taux d’évolution à partir d’un départ et d’une arrivée.',
      question: QUESTION_NUM_TAUX_EVOLUTION,
    },
    {
      id: 'E-CONCEPT',
      brique: 'fp-concept4',
      dureeMinutes: 6,
      concepts: ['coefficient-multiplicateur'],
      notes: 'Démonstration interactive du coefficient multiplicateur.',
      proprietes: {
        parametres: [
          {
            cle: 'prix',
            libelle: 'Prix de départ',
            min: 50,
            max: 1000,
            pas: 10,
            defaut: 200,
          },
          {
            cle: 'taux',
            libelle: 'Taux d’évolution (%)',
            min: -50,
            max: 50,
            pas: 1,
            defaut: 15,
          },
        ],
        formuleLatexSimplifie: 'prix \\times (1 + \\dfrac{taux}{100})',
        calcul: 'prix*(1+taux/100)',
        phrase:
          'Un prix de {prix} € qui évolue de {taux} % devient {resultat} €.',
      },
    },
    {
      id: 'E-QUESTIONNAIRE',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['coefficient-multiplicateur', 'proportion'],
      notes:
        'Application chiffrée : coefficient multiplicateur et proportionnalité.',
      regime: 'focus',
      questions: [
        QUESTION_QUESTIONNAIRE_COEFFICIENT,
        QUESTION_QUESTIONNAIRE_PROPORTION,
      ],
    },
    {
      id: 'E-REMEDIATION',
      brique: 'fp-worked',
      dureeMinutes: 6,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      notes:
        'Remédiation ciblée sur les quatre confusions les plus fréquentes.',
      proprietes: {
        enonce:
          'Reprenons pas à pas le calcul d’un taux d’évolution et d’un coefficient multiplicateur.',
        etapes: [
          {
            id: 'etape-1',
            intitule: 'Identifier le départ et l’arrivée',
            raisonnement:
              'Le taux d’évolution compare toujours l’écart à la valeur de départ, jamais à la valeur d’arrivée.',
            invite: 'Quelle est la valeur de départ dans cet exemple ?',
          },
          {
            id: 'etape-2',
            intitule: 'Calculer l’écart',
            raisonnement:
              'L’écart est la différence entre l’arrivée et le départ, exprimée dans la même unité que les deux valeurs.',
            invite: 'Quel est l’écart entre le départ et l’arrivée ?',
          },
          {
            id: 'etape-3',
            intitule: 'Passer au coefficient multiplicateur',
            raisonnement:
              'Le coefficient multiplicateur 1,15 correspond à une hausse de 15 %, pas à une hausse de 1,15 %.',
            invite:
              'Quel coefficient multiplicateur correspond à une hausse de 15 % ?',
          },
        ],
      },
    },
    {
      id: 'E-EXIT',
      brique: 'fp-exit',
      dureeMinutes: 4,
      concepts: ['taux-evolution'],
      notes: 'Billet de sortie sur le sens du taux d’évolution.',
      question: QUESTION_EXIT_TAUX,
      invite: 'Qu’est-ce qui reste flou pour toi sur les taux d’évolution ?',
    },
  ],
  remediations: {
    'raisonnement-additif': 'E-REMEDIATION',
    'base-arrivee': 'E-REMEDIATION',
    'ecart-absolu-au-lieu-du-taux': 'E-REMEDIATION',
    'coefficient-confondu-avec-taux': 'E-REMEDIATION',
  },
  derogations: [],
};
