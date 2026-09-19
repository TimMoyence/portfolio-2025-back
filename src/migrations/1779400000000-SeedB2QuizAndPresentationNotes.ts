import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

interface QuizSeed {
  readonly screenId: string;
  readonly id: string;
  readonly concept: string;
  readonly question: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly confusions: readonly string[];
  readonly guide: {
    readonly aDire: string;
    readonly question: string;
    readonly reponse: string;
    readonly calcul?: string;
    readonly relance: string;
    readonly transition: string;
  };
}

export const QUIZZES: readonly QuizSeed[] = [
  {
    screenId: 'B2-01-S03-PREDICTION',
    id: 'b2-s03-prediction',
    concept: 'proportion',
    question:
      'Une courbe paraît plus pentue que l’autre. Que vérifier avant de conclure ?',
    options: [
      'Les valeurs, l’unité et l’échelle',
      'La couleur de la courbe',
      'Le nombre de points',
      'La taille du titre',
    ],
    correctIndex: 0,
    confusions: [
      'raisonnement-additif',
      'taux-valeur-facteur-cent',
      'ecart-absolu-au-lieu-du-taux',
    ],
    guide: {
      aDire: 'Avant de commenter la pente, vérifiez le repère.',
      question: 'Que faut-il contrôler avant de comparer les deux courbes ?',
      reponse: 'Les valeurs, l’unité, la période et l’échelle.',
      relance: 'Les valeurs ont-elles changé ou seulement la représentation ?',
      transition:
        'Le prochain écran montre comment une échelle modifie l’impression.',
    },
  },
  {
    screenId: 'B2-01-S09-FONDATIONS',
    id: 'b2-s09-fondations',
    concept: 'pourcentage',
    question: '« 27,6 % » suffit-il pour décider ?',
    options: ['Oui', 'Non', 'Cela dépend'],
    correctIndex: 1,
    confusions: ['taux-valeur-facteur-cent', 'base-arrivee'],
    guide: {
      aDire:
        'Un pourcentage est un rapport : il faut connaître ce qu’il rapporte.',
      question: 'Quelles informations manquent pour interpréter 27,6 % ?',
      reponse: 'L’indicateur, la base, la période, le périmètre et la source.',
      relance: '27,6 % de quoi, sur quelle période et comparé à quelle base ?',
      transition:
        'Nous allons maintenant transformer une valeur en taux contrôlable.',
    },
  },
  {
    screenId: 'B2-01-S23-INFLATION',
    id: 'b2-s23-inflation',
    concept: 'taux-evolution',
    question: 'L’inflation baisse. Les prix baissent-ils ?',
    options: ['Oui', 'Non', 'Cela dépend'],
    correctIndex: 1,
    confusions: ['hausse-baisse-symetriques', 'base-arrivee'],
    guide: {
      aDire:
        'Une inflation plus faible signifie une hausse plus lente, pas nécessairement une baisse des prix.',
      question: 'Le taux baisse : que devient le niveau général des prix ?',
      reponse: 'Il continue d’augmenter tant que le taux reste positif.',
      relance: 'Le taux mesure-t-il le niveau ou la vitesse de variation ?',
      transition: 'Passons d’un taux annuel à une lecture cumulée de l’indice.',
    },
  },
  {
    screenId: 'B2-01-S25-DESINFLATION',
    id: 'b2-s25-desinflation',
    concept: 'taux-evolution',
    question: 'De 4,9 % à 2,0 %, que devient le niveau général des prix ?',
    options: [
      'Il baisse',
      'Il reste stable',
      'Il augmente encore',
      'Impossible à savoir',
    ],
    correctIndex: 2,
    confusions: [
      'hausse-baisse-symetriques',
      'base-arrivee',
      'ecart-absolu-au-lieu-du-taux',
    ],
    guide: {
      aDire:
        'La désinflation ralentit la hausse ; elle n’annule pas les hausses passées.',
      question: '2,0 % est-il un taux négatif ?',
      reponse: 'Non : le niveau des prix augmente encore, mais moins vite.',
      relance: 'Que faudrait-il observer pour parler de baisse des prix ?',
      transition:
        'Nous allons vérifier cette distinction sur une série indexée.',
    },
  },
  {
    screenId: 'B2-01-S31-RELECTURE',
    id: 'b2-s31-relecture',
    concept: 'proportion',
    question: 'Que vérifier en premier sur les graphiques du défi initial ?',
    options: [
      'Le titre',
      'L’origine et l’amplitude de l’axe',
      'La couleur',
      'L’épaisseur',
    ],
    correctIndex: 1,
    confusions: [
      'raisonnement-additif',
      'taux-valeur-facteur-cent',
      'ecart-absolu-au-lieu-du-taux',
    ],
    guide: {
      aDire: 'Un graphique se contrôle d’abord par son repère.',
      question: 'Quel élément peut amplifier visuellement une variation ?',
      reponse: 'L’origine et l’amplitude de l’axe.',
      relance: 'La série change-t-elle si vous changez uniquement l’axe ?',
      transition:
        'Après le repère, nous pouvons discuter la relation entre deux séries.',
    },
  },
  {
    screenId: 'B2-01-S35-CORRELATION',
    id: 'b2-s35-correlation',
    concept: 'proportion',
    question: 'Deux courbes qui montent ensemble prouvent-elles une cause ?',
    options: ['Oui', 'Non', 'Seulement avec une source'],
    correctIndex: 1,
    confusions: ['raisonnement-additif', 'base-arrivee'],
    guide: {
      aDire:
        'Une corrélation est un constat de mouvement commun, pas une preuve de mécanisme.',
      question: 'Quelle preuve manque avant d’affirmer une cause ?',
      reponse:
        'Une hypothèse testée, un périmètre, une période et des contrôles concurrents.',
      relance:
        'Quelles autres explications pourraient produire les deux hausses ?',
      transition:
        'Nous allons voir comment un effet de mix peut expliquer un écart.',
    },
  },
  {
    screenId: 'B2-01-S38-MIX',
    id: 'b2-s38-mix',
    concept: 'pourcentage',
    question:
      'Le chiffre d’affaires et la marge augmentent, mais le taux de marge baisse. Quelle première conclusion est défendable ?',
    options: [
      'Erreur certaine',
      'Effet de mix possible',
      'Aucune analyse n’est nécessaire',
    ],
    correctIndex: 1,
    confusions: ['raisonnement-additif', 'base-arrivee'],
    guide: {
      aDire:
        'Le chiffre d’affaires, la marge et le taux de marge ne mesurent pas la même chose.',
      question:
        'Comment les trois indicateurs peuvent-ils évoluer différemment ?',
      reponse:
        'Un changement de composition peut augmenter la marge en euros et réduire le taux moyen.',
      calcul: 'Taux de marge = marge / chiffre d’affaires.',
      relance:
        'Quel canal pèse davantage qu’avant dans le chiffre d’affaires ?',
      transition: 'Calculons maintenant l’effet des poids sur un taux global.',
    },
  },
  {
    screenId: 'B2-01-S46-VOTE-1',
    id: 'b2-s46-peer-vote-1',
    concept: 'pourcentage',
    question:
      'Le taux global baisse alors que chaque taux local est stable. Quelle explication est possible ?',
    options: [
      'Une erreur certaine',
      'Un changement de mix',
      'Une baisse de tous les volumes',
      'Aucune explication',
    ],
    correctIndex: 1,
    confusions: [
      'raisonnement-additif',
      'base-arrivee',
      'ecart-absolu-au-lieu-du-taux',
    ],
    guide: {
      aDire: 'Un taux global est une moyenne pondérée.',
      question: 'Quel élément peut changer sans modifier les taux locaux ?',
      reponse: 'Le poids de chaque canal dans le total.',
      calcul: 'Poids d’un canal = CA du canal / CA total.',
      relance: 'Quel canal moins rentable a pris plus de poids ?',
      transition:
        'Défendons cette explication avec un cas chiffré à deux canaux.',
    },
  },
  {
    screenId: 'B2-01-S48-VOTE-2',
    id: 'b2-s48-peer-vote-2',
    concept: 'pourcentage',
    question:
      'Le taux global baisse alors que chaque taux local est stable. Quel argument faut-il mobiliser ?',
    options: [
      'Les poids des canaux',
      'La couleur du graphique',
      'Le nombre de canaux seulement',
    ],
    correctIndex: 0,
    confusions: ['raisonnement-additif', 'taux-valeur-facteur-cent'],
    guide: {
      aDire:
        'Pour expliquer un taux global, reliez toujours taux locaux et poids.',
      question: 'Quel argument permet de passer du constat à l’explication ?',
      reponse: 'La variation des poids et son effet sur la moyenne pondérée.',
      relance: 'Pouvez-vous écrire la contribution de chaque canal ?',
      transition:
        'Passons du raisonnement de mix au contrôle d’une pièce comptable.',
    },
  },
  {
    screenId: 'B2-01-S50-PACIOLI',
    id: 'b2-s50-pacioli',
    concept: 'proportion',
    question:
      'Une concordance des totaux signifie-t-elle qu’il n’y a aucune erreur ?',
    options: [
      'Oui',
      'Non, des erreurs peuvent se compenser',
      'Oui, si le total est signé',
    ],
    correctIndex: 1,
    confusions: ['raisonnement-additif', 'base-arrivee'],
    guide: {
      aDire:
        'Un total concordant est un signal de cohérence, pas une preuve ligne par ligne.',
      question:
        'Deux erreurs opposées peuvent-elles laisser le total inchangé ?',
      reponse: 'Oui, elles peuvent se compenser.',
      relance: 'Que faut-il rapprocher pour prouver chaque écriture ?',
      transition:
        'Nous allons utiliser un indice numérique sans le confondre avec une preuve.',
    },
  },
  {
    screenId: 'B2-01-S54-MULTIPLE-NEUF',
    id: 'b2-s54-multiple-neuf',
    concept: 'proportion',
    question:
      'Un écart de 90 €, divisible par 9, prouve-t-il une transposition ?',
    options: [
      'Oui',
      'Non, c’est un indice à confirmer',
      'Seulement si le total concorde',
    ],
    correctIndex: 1,
    confusions: ['raisonnement-additif', 'base-arrivee'],
    guide: {
      aDire:
        'Le test du multiple de 9 aide à chercher ; il ne suffit pas à prouver.',
      question: 'Quelle pièce permet de confirmer l’écart ?',
      reponse: 'La comparaison avec la pièce source.',
      calcul: '90 est divisible par 9 : indice de recherche, pas verdict.',
      relance: 'Quelle valeur attendue figure sur le justificatif ?',
      transition: 'Voyons un cas où deux erreurs se compensent dans le total.',
    },
  },
  {
    screenId: 'B2-01-S57-COMPENSATION',
    id: 'b2-s57-compensation',
    concept: 'proportion',
    question:
      'Le total concorde, mais F002 est à +100 € et F003 à -100 €. Peut-on valider ?',
    options: ['Oui', 'Non, les erreurs se compensent'],
    correctIndex: 1,
    confusions: ['raisonnement-additif'],
    guide: {
      aDire: 'Un total juste peut masquer des lignes fausses.',
      question: 'Que faut-il contrôler malgré la concordance du total ?',
      reponse: 'Chaque écart non nul et sa pièce source.',
      calcul:
        '+100 € - 100 € = 0 € au total, mais deux lignes restent erronées.',
      relance: 'Le total prouve-t-il chacune des lignes ?',
      transition:
        'Terminons par deux contrôles rapides : points et preuve indépendante.',
    },
  },
  {
    screenId: 'B2-01-S63-FLASH-POINTS',
    id: 'b2-s63-flash-points',
    concept: 'taux-evolution',
    question: 'Un taux passe de 12 % à 15 %. Quel écart en points ?',
    options: ['3 points', '25 points', '0,25 point'],
    correctIndex: 0,
    confusions: ['ecart-absolu-au-lieu-du-taux', 'taux-valeur-facteur-cent'],
    guide: {
      aDire: 'Entre deux taux, nommez l’unité de comparaison.',
      question: 'Quel est l’écart en points ?',
      reponse: '15 % - 12 % = +3 points.',
      calcul: 'En relatif : 3 / 12 = +25 %.',
      relance: 'Parlez-vous d’un écart en points ou d’une évolution relative ?',
      transition:
        'Le dernier contrôle rappelle la différence entre indice et preuve.',
    },
  },
  {
    screenId: 'B2-01-S64-FLASH-PREUVE',
    id: 'b2-s64-flash-preuve',
    concept: 'proportion',
    question: 'Un multiple de 9 suffit-il à prouver une transposition ?',
    options: ['Oui', 'Non, il faut rapprocher une pièce source'],
    correctIndex: 1,
    confusions: ['raisonnement-additif'],
    guide: {
      aDire:
        'Un contrôle rapide oriente la recherche ; une preuve indépendante valide.',
      question: 'Quelle preuve faut-il conserver ?',
      reponse: 'Le rapprochement de l’écriture avec la pièce source.',
      relance: 'Quel tiers doit pouvoir refaire le contrôle ?',
      transition:
        'La synthèse transforme ces contrôles en décision professionnelle.',
    },
  },
];

export class SeedB2QuizAndPresentationNotes1779400000000 implements MigrationInterface {
  name = 'SeedB2QuizAndPresentationNotes1779400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const quiz of QUIZZES) {
      const interaction = {
        type: 'quiz',
        id: quiz.id,
        concept: quiz.concept,
        noteCompte: true,
        question: quiz.question,
        options: quiz.options,
        optionIds: quiz.options.map((_, index) => `o${index + 1}`),
        correctIndex: quiz.correctIndex,
        confusions: quiz.confusions,
        context: quiz.guide.aDire,
        explanation: quiz.guide.reponse,
        nextAction: quiz.guide.transition,
      };
      await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "proprietes" = "proprietes" || $1::jsonb
         WHERE "course_id" = $2 AND "screen_id" = $3`,
        [
          JSON.stringify({ interaction, guide: quiz.guide }),
          COURSE_ID,
          quiz.screenId,
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const quiz of QUIZZES) {
      await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "proprietes" = "proprietes" - 'interaction' - 'guide'
         WHERE "course_id" = $1 AND "screen_id" = $2`,
        [COURSE_ID, quiz.screenId],
      );
    }
  }
}
