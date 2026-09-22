export const B2_VISUAL_SNAPSHOT = [
  {
    position: 0,
    screenId: 'B2-01-S01-ACCROCHE',
    renderer: 'hero',
    props: {
      title: 'Lire un chiffre, ce n’est pas le croire',
      subtitle:
        '3 h 30 pour passer d’un nombre affiché à une décision contrôlée.',
      bgImageAlt: 'Documents financiers et calculatrice sur un bureau',
      bullets: ['BTS Comptabilité et Gestion · Deuxième année'],
      bgImage:
        'https://images.pexels.com/photos/33175649/pexels-photo-33175649.jpeg?auto=compress&cs=tinysrgb&w=1600',
    },
  },
  {
    position: 1,
    screenId: 'B2-01-S02-CONTRAT',
    renderer: 'method-path',
    props: {
      title: 'Sommaire de la donnée à la décision',
      subtitle:
        'Avant de calculer, le professionnel s’accorde avec le lecteur sur ce qui est mesuré et sur ce qui pourra être conclu.',
      steps: [
        {
          id: 'lire',
          title: 'Lire',
          question: 'Qu’est-ce qui est réellement mesuré ?',
          proof: 'Unité, période, périmètre et source.',
          result: 'Un chiffre dont le sens est défendable.',
        },
        {
          id: 'calculer',
          title: 'Calculer',
          question: 'Quelle base et quelle opération répondent à la question ?',
          proof: 'Écart, taux, points, coefficient ou moyenne pondérée.',
          result: 'Un résultat reproductible par un autre professionnel.',
        },
        {
          id: 'representer',
          title: 'Représenter',
          question: 'Quelle relation le lecteur doit-il vérifier ?',
          proof: 'Titre, unité, axes, échelle et source.',
          result: 'Une forme fidèle aux valeurs, sans effet de manche.',
        },
        {
          id: 'expliquer',
          title: 'Expliquer',
          question: 'Quel mécanisme peut expliquer l’écart observé ?',
          proof: 'Poids, mix, volume et hypothèses alternatives.',
          result: 'Une cause plausible, séparée du simple constat.',
        },
        {
          id: 'prouver',
          title: 'Prouver',
          question: 'Quelle trace permet de vérifier la conclusion ?',
          proof: 'Source, rapprochement, contrôle et limite.',
          result: 'Une décision traçable et auditable.',
        },
        {
          id: 'outiller',
          title: 'Outiller',
          question: 'Comment gagner du temps sans perdre la maîtrise ?',
          proof:
            'Excel, BI et IA avec contrôles, version et validation humaine.',
          result: 'Une automatisation utile, jamais une boîte noire.',
        },
      ],
    },
  },
  {
    position: 2,
    screenId: 'B2-01-S03-PREDICTION',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s03-prediction',
        type: 'quiz',
        question:
          'Une courbe paraît plus pentue que l’autre. Que vérifier avant de conclure ?',
        options: [
          'Les valeurs, l’unité et l’échelle',
          'La couleur de la courbe',
          'Le nombre de points',
          'La taille du titre',
        ],
        context:
          'En cabinet, en contrôle de gestion ou en audit, une pente peut donner une impression de performance avant même la lecture des valeurs. Le premier réflexe est de vérifier le repère.',
        competency: 'C4 · Représentation : distinguer valeur et perception',
      },
    },
    corrections: {
      correctIndex: 0,
      explanation:
        'Une forme ne suffit jamais. Il faut lire les valeurs, l’unité, la période et l’amplitude de l’axe avant de comparer deux évolutions.',
      nextAction:
        'Lire le titre, l’unité, la période, la source, l’origine et l’amplitude de l’axe avant de conclure. La slide suivante montre le piège.',
    },
  },
  {
    position: 3,
    screenId: 'B2-01-S04-AXES',
    renderer: 'chart',
    props: {
      title: 'Même série, deux lectures visuelles',
      caption: '100, 103, 105, 108',
      context:
        'Une même série peut sembler spectaculaire ou modeste selon l’échelle. En contrôle, l’impression doit rester compatible avec l’écart numérique.',
      unit: 'valeurs',
      formula:
        'Les valeurs et les écarts sont identiques. Seul le repère change.',
      reading:
        'L’écart total est de +8, soit +8 % par rapport à 100. L’axe 98 à 110 agrandit la pente sans créer de performance supplémentaire.',
      source:
        'Cas de comparaison : les deux vues reprennent la série 100, 103, 105, 108 avec deux amplitudes d’axe.',
      labels: ['2021', '2022', '2023', '2024'],
      series: [
        {
          label: 'Série A',
          values: [100, 103, 105, 108],
          tone: 'teal',
        },
        {
          label: 'Série B',
          values: [100, 103, 105, 108],
          tone: 'gold',
        },
      ],
      axisRanges: [
        [0, 120],
        [98, 110],
      ],
      axisLabels: ['0 à 120', '98 à 110'],
    },
  },
  {
    position: 4,
    screenId: 'B2-01-S05-ANATOMIE',
    renderer: 'grid',
    props: {
      title: '27,6 % : le contrat de lecture d’un taux',
      subtitle:
        'Le contrat lie le producteur de la donnée, le professionnel qui la contrôle et le décideur. Il fixe la mesure, la base, la période, le périmètre et la source.',
      items: [
        {
          title: 'Mesure',
          description: 'Quel indicateur ?',
        },
        {
          title: 'Période',
          description: 'Quel exercice ?',
        },
        {
          title: 'Périmètre',
          description: 'Quelle entité ?',
        },
        {
          title: 'Source',
          description: 'Quel document ?',
        },
        {
          title: 'Base',
          description: 'Rapporté à quoi ?',
        },
      ],
    },
  },
  {
    position: 5,
    screenId: 'B2-01-S06-HABILLER',
    renderer: 'grid',
    props: {
      title: 'Fiche d’identité d’un indicateur',
      subtitle:
        'Un indicateur professionnel précise ce qui est mesuré, comparé et vérifiable.',
      items: [
        {
          title: 'Mesure',
          description: 'Quel indicateur lit-on ?',
          back: 'Taux de marge = marge totale / chiffre d’affaires total.',
        },
        {
          title: 'Base',
          description: 'Rapporté à quoi ?',
          back: '289 800 € de marge / 1 050 000 € de chiffre d’affaires.',
        },
        {
          title: 'Période',
          description: 'Quand ?',
          back: 'Exercice 2024 : la période observée.',
        },
        {
          title: 'Périmètre',
          description: 'Pour qui ?',
          back: 'Société ou établissement retenu dans le sujet.',
        },
        {
          title: 'Source',
          description: 'D’où vient le montant ?',
          back: 'Grand livre et compte de résultat : les montants peuvent être retrouvés.',
        },
      ],
    },
  },
  {
    position: 6,
    screenId: 'B2-01-S07-COMPATIBILITE',
    renderer: 'comparison',
    props: {
      title: 'Avant tout calcul : comparer la même chose',
      subtitle:
        'Un calcul juste sur des bases incompatibles produit une conclusion fausse.',
      note: 'Réflexe de futur comptable : écrire la période, le périmètre et l’unité avant la formule.',
      columns: [
        {
          label: 'CA mensuel / CA annuel',
          tone: 'danger',
          items: ['Pas comparable directement', 'Ramener sur une même période'],
        },
        {
          label: 'Marge HT / ventes TTC',
          tone: 'warning',
          items: ['Unités différentes', 'Retirer la TVA ou refuser'],
        },
        {
          label: 'Exercice 2024 / cumul janvier-juin 2025',
          tone: 'warning',
          items: ['Périodes différentes', 'Choisir une période commune'],
        },
        {
          label: 'Société / établissement',
          tone: 'warning',
          items: ['Périmètres différents', 'Vérifier le périmètre commun'],
        },
      ],
    },
  },
  {
    position: 7,
    screenId: 'B2-01-S08-UNITES',
    renderer: 'stats',
    props: {
      title: 'Quatre écritures, quatre questions',
      subtitle:
        'Chaque écriture répond à une question différente. Les mélanger dans une note crée une ambiguïté de décision.',
      stats: [
        {
          value: '18 000 €',
          label: 'valeur',
        },
        {
          value: '18 %',
          label: 'rapport',
        },
        {
          value: '+3 pts',
          label: 'écart entre deux taux',
        },
        {
          value: '107',
          label: 'indice : niveau relatif',
        },
      ],
    },
  },
  {
    position: 8,
    screenId: 'B2-01-S09-FONDATIONS',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s09-fondations',
        type: 'quiz',
        question: '« 27,6 % » suffit-il pour décider ?',
        options: ['Oui', 'Non', 'Cela dépend'],
        context:
          'Un taux est une information relationnelle. Sans sa base, sa période et son périmètre, il ne permet pas de comparer ni de recommander.',
        competency: 'C1 · Sens du chiffre : établir le contrat de lecture',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        '27,6 % décrit un rapport, mais ne dit pas quel indicateur est mesuré, sur quelle base, pour quelle période, ni avec quelle source.',
      nextAction:
        'Demander la mesure, l’unité, la période, le périmètre, la source et la règle d’agrégation.',
    },
  },
  {
    position: 9,
    screenId: 'B2-01-S10-CONTROLEUR',
    renderer: 'comparison',
    props: {
      title: 'Le raisonnement professionnel en six questions',
      subtitle:
        'Le calcul arrive après la définition du problème. La conclusion arrive après le contrôle.',
      note: 'La dernière phrase doit distinguer ce qui est démontré de ce qui reste une hypothèse.',
      columns: [
        {
          label: 'Définir',
          tone: 'info',
          items: ['Quel indicateur ?', 'Quelle question ?'],
        },
        {
          label: 'Comparer',
          tone: 'info',
          items: ['Même période ?', 'Même périmètre ?'],
        },
        {
          label: 'Calculer',
          tone: 'neutral',
          items: ['Écart : -2,30 points', 'Marge : +1 200 €'],
        },
        {
          label: 'Chercher',
          tone: 'warning',
          items: ['Mix des ventes', 'Taux locaux'],
        },
        {
          label: 'Contrôler',
          tone: 'warning',
          items: ['Source', 'Agrégation'],
        },
        {
          label: 'Conclure',
          tone: 'success',
          items: ['Dire ce qui est prouvé', 'Dire la limite'],
        },
      ],
    },
  },
  {
    position: 10,
    screenId: 'B2-01-S11-C1',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s11-c1',
        type: 'reflection',
        question:
          'Un tableau affiche « 4,9 » dans une colonne Performance. Quelle est votre première question ?',
        placeholder: 'Mesure, unité, période et source…',
        context:
          'Vous préparez une revue d’indicateurs pour un dirigeant. Une valeur isolée peut être exacte et pourtant inutilisable.',
        competency: 'C1 · Sens du chiffre',
      },
    },
    corrections: {
      expected:
        'Demander au minimum l’indicateur, l’unité, la période, le périmètre, la source, la base de calcul et l’agrégation.',
      nextAction:
        'Refuser la comparaison tant que le contrat de lecture n’est pas complet.',
    },
  },
  {
    position: 11,
    screenId: 'B2-01-S12-ABSOLU-RELATIF',
    renderer: 'stats',
    props: {
      title: '120 000 € vers 138 000 € : deux questions',
      subtitle:
        'Le montant répond à « combien ? ». Le taux répond à « par rapport à quelle base ? ».',
      stats: [
        {
          value: '18 000 €',
          label: 'combien gagné ? · 138 000 - 120 000',
        },
        {
          value: '15 %',
          label: 'de combien en proportion ? · 18 000 / 120 000',
        },
      ],
    },
  },
  {
    position: 12,
    screenId: 'B2-01-S13-FORMULE',
    renderer: 'quote',
    props: {
      quote:
        'Taux d’évolution = (valeur d’arrivée - valeur de départ) / valeur de départ',
      author: 'Le dénominateur est la valeur de départ.',
      role: 'Valeur d’arrivée = valeur de départ × (1 + taux)',
      context:
        'Cette formule est la traduction d’une question de gestion. Elle ne devient fiable que si les deux valeurs portent sur la même mesure, la même unité et la même période.',
    },
  },
  {
    position: 13,
    screenId: 'B2-01-S14-CALCUL',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s14-calcul',
        type: 'reflection',
        question:
          'Le chiffre d’affaires passe de 120 000 € à 138 000 €. Calculez et interprétez le taux.',
        placeholder: 'Écart, dénominateur, taux et phrase complète…',
        context:
          'Le taux d’évolution répond à la question : de quelle proportion la valeur d’arrivée s’est-elle écartée de la valeur de départ ?',
        competency: 'C2 · Transformation',
      },
    },
    corrections: {
      expected: 'Écart : 18 000 €. Taux : 18 000 / 120 000 = 0,15, soit +15 %.',
      nextAction: 'Contrôler avec 120 000 × 1,15 = 138 000 €.',
    },
  },
  {
    position: 14,
    screenId: 'B2-01-S15-BASE',
    renderer: 'comparison',
    props: {
      title: 'Retrouver la base après +15 %',
      columns: [
        {
          label: 'Donnée connue',
          tone: 'info',
          items: ['Arrivée : 138 000 €', 'Coefficient : 1,15'],
        },
        {
          label: 'Opération inverse',
          tone: 'neutral',
          items: ['138 000 / 1,15', 'Base : 120 000 €'],
        },
        {
          label: 'Contrôle',
          tone: 'success',
          items: ['120 000 × 1,15', '= 138 000 €'],
        },
      ],
    },
  },
  {
    position: 15,
    screenId: 'B2-01-S16-POINTS',
    renderer: 'chart',
    props: {
      title: '12 % vers 15 % : deux réponses',
      caption: 'Écart entre deux taux',
      context:
        'Dans une analyse de marge, une différence de taux se rédige en points. Une variation relative décrit le taux lui-même.',
      unit: '%',
      formula:
        '+3 points répond à l’écart. +25 % répond à l’évolution du taux lui-même.',
      reading:
        'Une phrase rigoureuse dira : « le taux augmente de 3 points, soit +25 % en relatif ». L’unité évite de faire croire à une hausse de 25 points.',
      source:
        'Cas de comparaison : un taux passe de 12 % à 15 %. Les points et la variation relative répondent à deux questions.',
      labels: ['Taux initial', 'Taux final'],
      series: [
        {
          label: 'Taux',
          values: [12, 15],
          tone: 'teal',
        },
      ],
    },
  },
  {
    position: 16,
    screenId: 'B2-01-S17-HAUSSE-BAISSE',
    renderer: 'chart',
    props: {
      title: 'Le prix monte, puis redescend : que devient la marge ?',
      caption: '100 ventes · coût d’achat unitaire : 80 €',
      context:
        'Le prix de vente ne suffit pas à juger la performance. Il faut suivre le coût, la marge par vente, le chiffre d’affaires et la marge totale.',
      kind: 'line',
      unit: '€ par vente',
      formula:
        'CA : 10 000 vers 11 000 vers 9 900 € · marge totale : 2 000 vers 3 000 vers 1 900 €',
      reading:
        'Après la baisse, le prix reste inférieur à son pic et le CA revient sous son niveau initial. Avec un coût inchangé, la marge totale tombe à 1 900 €, soit 100 € de moins qu’au départ.',
      source:
        'Cas Atelier Nord : hypothèse de 100 ventes à chaque période et coût unitaire constant de 80 €.',
      labels: ['Prix initial', 'Après +10 %', 'Après -10 %'],
      series: [
        {
          label: 'Prix de vente unitaire',
          values: [100, 110, 99],
          tone: 'teal',
        },
        {
          label: "Coût d'achat unitaire",
          values: [80, 80, 80],
          tone: 'ink',
        },
        {
          label: 'Marge unitaire',
          values: [20, 30, 19],
          tone: 'gold',
        },
      ],
    },
  },
  {
    position: 17,
    screenId: 'B2-01-S18-COEFFICIENTS',
    renderer: 'stats',
    props: {
      title: 'La machine à coefficients',
      subtitle:
        'Écrire les coefficients rend visible la base de chaque variation et permet un contrôle inverse.',
      stats: [
        {
          value: '100',
          label: 'base',
        },
        {
          value: '× 1,10',
          label: '+10 % · 110',
        },
        {
          value: '× 0,90',
          label: '-10 % · 99',
        },
        {
          value: '99',
          label: 'valeur finale',
        },
      ],
    },
  },
  {
    position: 18,
    screenId: 'B2-01-S19-SUCCESSIVES',
    renderer: 'quote',
    props: {
      quote:
        'Les pourcentages successifs se multiplient ; ils ne s’additionnent pas.',
      author: '100 × 1,10 × 0,90 = 99',
      role: 'Chaque taux porte sur la valeur devenue courante.',
      context:
        'Les remises, hausses tarifaires et budgets révisés se traitent comme une chaîne de coefficients. L’addition des taux n’est qu’une approximation dans des cas limités.',
    },
  },
  {
    position: 19,
    screenId: 'B2-01-S20-HISTOIRE',
    renderer: 'comparison',
    props: {
      title: 'Du calcul à la décision : préparer la lecture graphique',
      subtitle: 'Une représentation vient après la question, pas avant.',
      note: 'Avant de choisir une forme, vérifiez que la relation à montrer est déjà définie dans le tableau source.',
      columns: [
        {
          label: 'Tableau source',
          tone: 'info',
          items: ['Valeurs et unités', 'Périodes et périmètre'],
        },
        {
          label: 'Calcul',
          tone: 'neutral',
          items: ['Écart ou taux', 'Base et arrondi'],
        },
        {
          label: 'Graphique',
          tone: 'success',
          items: ['Relation visible', 'Titre, axes et source'],
        },
      ],
    },
  },
  {
    position: 20,
    screenId: 'B2-01-S21-METHODE',
    renderer: 'comparison',
    props: {
      title: 'Quelle méthode répond à quelle question ?',
      columns: [
        {
          label: '80 000 vers 92 000',
          tone: 'info',
          items: ['Écart puis taux', '12 000 € · 15 %'],
        },
        {
          label: '12 % vers 15 %',
          tone: 'warning',
          items: ['Points puis relatif', '+3 points · +25 %'],
        },
        {
          label: '+8 % puis -5 %',
          tone: 'success',
          items: ['Coefficients successifs', '1,08 × 0,95 = 1,026'],
        },
      ],
    },
  },
  {
    position: 21,
    screenId: 'B2-01-S22-C2',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s22-c2',
        type: 'reflection',
        question:
          'Pourquoi +10 % puis -10 % ne ramène-t-il pas à la valeur initiale ?',
        placeholder: 'Bases différentes ; 10 % de 110 vaut 11.',
        context:
          'Une hausse puis une baisse portent sur deux bases différentes. Cette situation apparaît dans les remises, les prix, les volumes et les budgets.',
        competency: 'C2 · Transformation',
      },
    },
    corrections: {
      expected:
        '100 × 1,10 × 0,90 = 99. La baisse de 10 % porte sur 110, donc elle retire 11 et non 10.',
      nextAction:
        'Écrire les coefficients avant de calculer une série de variations.',
    },
  },
  {
    position: 22,
    screenId: 'B2-01-S23-INFLATION',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s23-inflation',
        type: 'quiz',
        question: 'L’inflation baisse. Les prix baissent-ils ?',
        options: ['Oui', 'Non', 'Cela dépend'],
        context:
          'Une baisse du rythme d’inflation ne signifie pas que le panier moyen revient à son prix initial.',
        competency: 'C2 · Transformation : distinguer rythme et niveau',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'L’inflation mesure une variation annuelle. Tant que le taux reste positif, l’indice des prix continue de monter, même si la hausse ralentit.',
      nextAction:
        'Tracer séparément le taux annuel et l’indice cumulé base 100.',
    },
  },
  {
    position: 23,
    screenId: 'B2-01-S24-SOURCE-INFLATION',
    renderer: 'table',
    props: {
      title: 'Lire la source avant la courbe',
      subtitle:
        'La série combine un taux annuel et un indice base 100. Le premier décrit le rythme ; le second décrit le niveau atteint.',
      note: 'Source pédagogique : inflation des prix à la consommation en France, donnée annuelle. La base 100 est fixée à la fin de 2019.',
      columns: [
        {
          key: 'year',
          label: 'Année',
        },
        {
          key: 'rate',
          label: 'Variation annuelle',
        },
        {
          key: 'index',
          label: 'Indice base 100',
        },
      ],
      rows: [
        {
          year: '2020',
          rate: '0,5 %',
          index: '100,50',
        },
        {
          year: '2021',
          rate: '1,6 %',
          index: '102,11',
        },
        {
          year: '2022',
          rate: '5,2 %',
          index: '107,42',
        },
        {
          year: '2023',
          rate: '4,9 %',
          index: '112,68',
        },
        {
          year: '2024',
          rate: '2,0 %',
          index: '114,93',
        },
      ],
      sourceLink: {
        href: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=FR',
        label: 'Banque mondiale, données FMI',
      },
    },
  },
  {
    position: 24,
    screenId: 'B2-01-S25-DESINFLATION',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s25-desinflation',
        type: 'quiz',
        question: 'De 4,9 % à 2,0 %, que devient le niveau général des prix ?',
        options: [
          'Il baisse',
          'Il reste stable',
          'Il augmente encore',
          'Impossible à savoir',
        ],
        context:
          'Pour un budget, une grille tarifaire ou une analyse de pouvoir d’achat, la question est de savoir si le niveau des prix a baissé ou si sa hausse a seulement ralenti.',
        competency: 'C2 · Transformation : lire une série cumulée',
      },
    },
    corrections: {
      correctIndex: 2,
      explanation:
        'Passer de 4,9 % à 2,0 % signifie que la hausse annuelle est moins forte. Comme 2,0 % reste positif, le niveau général des prix augmente encore.',
      nextAction: 'Vérifier l’indice cumulé avant de rédiger la conclusion.',
    },
  },
  {
    position: 25,
    screenId: 'B2-01-S26-RYTHME',
    renderer: 'chart',
    props: {
      title: 'Le taux mesure le rythme annuel',
      caption: 'Inflation en France',
      context:
        'Un taux positif mais plus faible correspond à une désinflation : les prix augmentent encore, à un rythme moins rapide.',
      unit: '% par an',
      formula:
        'Le taux ralentit en 2024, mais reste positif : le niveau des prix continue d’augmenter.',
      reading:
        'Le pic de 2022 est suivi d’un ralentissement. Pour un budget, cela change le rythme de révision, pas le niveau déjà atteint.',
      source:
        'International Financial Statistics du FMI via Banque mondiale, licence CC BY 4.0.',
      labels: ['2020', '2021', '2022', '2023', '2024'],
      series: [
        {
          label: 'Inflation annuelle',
          values: [0.5, 1.6, 5.2, 4.9, 2],
          tone: 'teal',
        },
      ],
    },
  },
  {
    position: 26,
    screenId: 'B2-01-S27-INDICE',
    renderer: 'chart',
    props: {
      title: 'L’indice mesure le niveau cumulé',
      caption: 'Base 100 fin 2019',
      context:
        'L’indice transforme chaque taux annuel en un niveau comparable à une base. Il conserve l’effet cumulé des années précédentes.',
      kind: 'line',
      unit: 'indice',
      formula:
        '100 vers 114,93 signifie environ +14,93 % depuis la base, pas 114,93 € ni +114,93 %.',
      reading:
        'Un indice 114,93 signifie qu’un panier valant 100 à la base vaut environ 114,93 dans la même unité d’indice. L’indice n’est pas un prix individuel.',
      source:
        'Calcul pédagogique à partir des taux annuels de la série ; définition de l’inflation : Banque mondiale et FMI.',
      labels: ['2020', '2021', '2022', '2023', '2024'],
      series: [
        {
          label: 'Indice base 100 fin 2019',
          values: [100.5, 102.1, 107.4, 112.7, 114.93],
          tone: 'gold',
        },
      ],
    },
  },
  {
    position: 27,
    screenId: 'B2-01-S28-CONCLUSION-INFLATION',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s28-inflation',
        type: 'reflection',
        question:
          'Entre fin 2019 et fin 2024, comment conclure sur l’indice et le rythme de l’inflation ?',
        placeholder: 'Constat, calcul, interprétation et limite…',
        context:
          'Une note de conjoncture doit distinguer le rythme de hausse annuel et le niveau de prix atteint depuis une base.',
        competency: 'C2 · Transformation et C1 · Sens du chiffre',
      },
    },
    corrections: {
      expected:
        'Le taux ralentit en 2024, mais l’indice atteint environ 114,93 : le niveau des prix est supérieur d’environ 14,93 % à la base.',
      nextAction: 'Citer la période, la base et l’unité dans la phrase finale.',
    },
  },
  {
    position: 28,
    screenId: 'B2-01-S29-PAUSE',
    renderer: 'grid',
    props: {
      title: 'Pause et reprise',
      subtitle:
        'Votre travail est sauvegardé. Reprenez avec le concept qui sécurise le plus votre prochaine décision chiffrée.',
      items: [
        {
          title: 'Coefficients successifs',
          description: 'Revoir le coefficient global.',
        },
        {
          title: 'Points et évolution',
          description: 'Revoir les deux unités de comparaison.',
        },
        {
          title: 'Échelle d’un graphique',
          description: 'Revoir l’origine et l’amplitude d’un axe.',
        },
        {
          title: 'Reprendre',
          description: 'Retour au parcours sans compte à rebours.',
        },
      ],
    },
  },
  {
    position: 29,
    screenId: 'B2-01-S30-PLAYFAIR',
    renderer: 'image-left',
    props: {
      imageAlt: 'Série commerciale historique de William Playfair',
      title: 'En 1786, le graphique devient un langage',
      subtitle:
        'Après le calcul, le graphique rend une relation visible sans remplacer la source.',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/d/d8/Playfair_TimeSeries.png',
      paragraphs: [
        'William Playfair utilise les séries commerciales pour rendre les évolutions comparables.',
        'Le graphique ne remplace pas la source : il organise la lecture et peut aussi orienter l’interprétation.',
      ],
      items: ['Titre', 'Axes', 'Séries', 'Source'],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries-2.png',
        label: 'Ouvrir le document original · Wikimedia Commons',
      },
    },
  },
  {
    position: 30,
    screenId: 'B2-01-S31-RELECTURE',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s31-relecture',
        type: 'quiz',
        question:
          'Que vérifier en premier sur les graphiques du défi initial ?',
        options: [
          'Le titre',
          'L’origine et l’amplitude de l’axe',
          'La couleur',
          'L’épaisseur',
        ],
        context:
          'Un analyste commence par vérifier le repère avant de commenter la forme. Un graphique exact peut tout de même produire une lecture disproportionnée.',
        competency: 'C4 · Représentation : auditer l’échelle',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'L’origine et l’amplitude de l’axe déterminent l’espace visuel accordé à la variation. Les couleurs et l’épaisseur ne prouvent rien.',
      nextAction:
        'Comparer la valeur absolue, la variation relative et la plage de l’axe.',
    },
  },
  {
    position: 31,
    screenId: 'B2-01-S32-AMPLITUDE',
    renderer: 'chart',
    props: {
      title: 'Même valeur, échelle différente',
      caption: '100, 103, 105, 108',
      context:
        'Dans un reporting, la mise en forme ne doit pas faire croire à un écart matériel qui n’existe pas dans les données.',
      unit: 'valeurs',
      formula:
        'Une vue amplifie la pente, l’autre la remet en perspective. Les valeurs ne changent jamais.',
      reading:
        'Avant de commenter la pente, comparez la différence absolue (+8), la variation relative (+8 %) et l’amplitude affichée.',
      source:
        'Cas de comparaison : les deux vues reprennent la série 100, 103, 105, 108 avec deux amplitudes d’axe.',
      labels: ['2021', '2022', '2023', '2024'],
      series: [
        {
          label: 'Série A',
          values: [100, 103, 105, 108],
          tone: 'teal',
        },
        {
          label: 'Série B',
          values: [100, 103, 105, 108],
          tone: 'gold',
        },
      ],
      axisRanges: [
        [0, 120],
        [98, 110],
      ],
    },
  },
  {
    position: 32,
    screenId: 'B2-01-S33-FORME',
    renderer: 'comparison',
    props: {
      title: 'Choisir une forme pour une question',
      subtitle:
        'Le type de graphique est une décision de communication. Il dépend de la relation que le lecteur doit vérifier.',
      note: 'Une forme plus spectaculaire n’est pas plus informative si elle masque l’unité, la période ou le volume.',
      columns: [
        {
          label: 'Évolution continue',
          tone: 'info',
          items: ['Courbe', 'Suivre un mouvement dans le temps'],
        },
        {
          label: 'Comparer des catégories',
          tone: 'success',
          items: ['Barres', 'Comparer des niveaux distincts'],
        },
        {
          label: 'Contribution cumulée',
          tone: 'warning',
          items: ['Aire avec prudence', 'Vérifier le volume représenté'],
        },
      ],
    },
  },
  {
    position: 33,
    screenId: 'B2-01-S34-TITRE',
    renderer: 'grid',
    props: {
      title: 'Le titre oriente la lecture',
      subtitle: 'Un titre professionnel décrit avant d’interpréter.',
      items: [
        {
          title: 'Forte progression',
          description: 'Interprétatif',
          back: 'Quel seuil justifie « forte » ?',
        },
        {
          title: '+8 points en trois ans',
          description: 'Chiffre précis',
          back: 'La base et l’unité doivent rester visibles.',
        },
        {
          title: 'Indice 100 à 108 entre 2021 et 2024',
          description: 'Descriptif robuste',
          back: 'Le titre répond à la question sans exagérer.',
        },
      ],
    },
  },
  {
    position: 34,
    screenId: 'B2-01-S35-CORRELATION',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s35-correlation',
        type: 'quiz',
        question:
          'Deux courbes qui montent ensemble prouvent-elles une cause ?',
        options: ['Oui', 'Non', 'Seulement avec une source'],
        context:
          'Deux indicateurs qui évoluent ensemble peuvent avoir une cause commune, une relation indirecte ou une simple coïncidence.',
        competency:
          'C4 · Représentation : ne pas confondre corrélation et causalité',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'Deux courbes ascendantes ne suffisent pas à établir un mécanisme causal. Il faut une hypothèse, un périmètre, une période et des contrôles concurrents.',
      nextAction:
        'Formuler au moins deux explications alternatives avant d’attribuer une cause.',
    },
  },
  {
    position: 35,
    screenId: 'B2-01-S36-NIGHTINGALE',
    renderer: 'image-right',
    props: {
      imageAlt:
        'Diagramme polaire de Florence Nightingale sur les causes de mortalité',
      title: 'Florence Nightingale : faire décider par les données',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/1/17/Nightingale-mortality.jpg',
      paragraphs: [
        'En 1858, son diagramme polaire rend visible la part des décès liés aux maladies évitables.',
        'La représentation sert une décision publique : comparer, expliquer, agir.',
        'Sans légende ni source, la même image perd sa portée de preuve.',
      ],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg',
        label: 'Voir le document original · Wikimedia Commons',
      },
    },
  },
  {
    position: 36,
    screenId: 'B2-01-S37-AUDIT-GRAPHIQUE',
    renderer: 'grid',
    props: {
      title: 'Audit express du graphique',
      subtitle:
        'Cochez le premier défaut avant de discuter de la pente. Un graphique fiable permet ensuite d’expliquer un total et ses écarts.',
      items: [
        {
          title: 'Titre',
          description: 'Question et mesure.',
        },
        {
          title: 'Unité',
          description: '€ , % , point ou indice.',
        },
        {
          title: 'Période',
          description: 'Dates et fréquence.',
        },
        {
          title: 'Source',
          description: 'Origine vérifiable.',
        },
        {
          title: 'Axe',
          description: 'Origine et amplitude.',
        },
        {
          title: 'Tableau',
          description: 'Alternative aux formes.',
        },
      ],
    },
  },
  {
    position: 37,
    screenId: 'B2-01-S38-MIX',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s38-mix',
        type: 'quiz',
        question:
          'Le chiffre d’affaires et la marge augmentent, mais le taux de marge baisse. Quelle première conclusion est défendable ?',
        options: [
          'Erreur certaine',
          'Effet de mix possible',
          'Aucune analyse n’est nécessaire',
        ],
        context:
          'Le chiffre d’affaires, la marge en euros et le taux de marge répondent à trois questions différentes. Leur évolution peut diverger sans qu’il y ait une erreur.',
        competency: 'C3 · Agrégation : lire l’effet de composition',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'Un canal moins rentable peut peser davantage dans le chiffre d’affaires. La marge totale peut progresser tandis que le taux moyen recule.',
      nextAction:
        'Comparer les taux locaux, les poids de chaque canal et les totaux en valeur.',
    },
  },
  {
    position: 38,
    screenId: 'B2-01-S39-PREVISION-MIX',
    renderer: 'comparison',
    props: {
      title: 'Prévoir l’effet du mix',
      subtitle:
        'Avant la formule, regardez quel canal gagne ou perd du poids et comparez son taux local au taux global.',
      note: 'La prévision est une hypothèse de travail. Le calcul pondéré et les chiffres de CA la transforment en conclusion.',
      columns: [
        {
          label: 'Conseil',
          tone: 'success',
          items: ['Taux local élevé', 'Poids en baisse'],
        },
        {
          label: 'Plateforme',
          tone: 'warning',
          items: ['Taux local faible', 'Poids en hausse'],
        },
        {
          label: 'Prévision',
          tone: 'info',
          items: [
            'Le taux global baisse probablement',
            'La preuve vient des poids',
          ],
        },
      ],
    },
  },
  {
    position: 39,
    screenId: 'B2-01-S40-PONDEREE',
    renderer: 'quote',
    props: {
      quote: 'Taux global = somme des marges / somme des chiffres d’affaires',
      author: 'Le poids d’un canal est CA du canal / CA total.',
      role: 'Une moyenne simple suppose des poids égaux.',
      context:
        'Dans un portefeuille de ventes, chaque canal contribue selon son chiffre d’affaires. Le taux global est donc une moyenne pondérée, pas la moyenne des pourcentages affichés.',
    },
  },
  {
    position: 40,
    screenId: 'B2-01-S41-SIMULATEUR-MIX',
    renderer: 'chart',
    props: {
      title: 'Quand la plateforme pèse plus, le taux global baisse',
      caption: 'CA total fixé à 1 000 000 €',
      context:
        'Le taux Conseil reste à 36 %, Maintenance à 28 % et Plateforme à 16 %. La seule variable est la répartition du CA.',
      unit: '%',
      formula: 'Les taux locaux restent constants. Seuls les poids changent.',
      reading:
        'Le taux global passe de 28,8 % à 24,0 %. Avec 1 000 000 € de CA, la marge passe de 288 000 € à 240 000 € : -48 000 € sans baisse des taux locaux.',
      source:
        'Hypothèses du cas Atelier Nord : Conseil 36 %, Maintenance 28 %, Plateforme 16 %.',
      labels: ['Mix 40 / 40 / 20', 'Mix 25 / 25 / 50'],
      series: [
        {
          label: 'Taux global',
          values: [28.8, 24],
          tone: 'teal',
        },
        {
          label: 'Part plateforme',
          values: [20, 50],
          tone: 'gold',
        },
      ],
    },
  },
  {
    position: 41,
    screenId: 'B2-01-S42-VALEUR-TAUX',
    renderer: 'comparison',
    props: {
      title: 'Valeur et taux ne racontent pas la même chose',
      subtitle:
        'La valeur mesure un montant créé. Le taux mesure une efficacité relative par rapport à une base.',
      note: 'Conclusion défendable : la marge en euros progresse légèrement, mais le rendement du CA se dégrade. La cause reste à vérifier.',
      columns: [
        {
          label: 'Marge en euros',
          tone: 'success',
          items: ['2024 : 289 800 €', '2025 : 291 000 €', '+1 200 €'],
        },
        {
          label: 'Taux de marge',
          tone: 'danger',
          items: ['2024 : 27,60 %', '2025 : 25,3043 %', '-2,30 points'],
        },
        {
          label: 'Chiffre d’affaires',
          tone: 'info',
          items: [
            '1 050 000 € vers 1 150 000 €',
            '+100 000 €',
            'La base grandit plus vite',
          ],
        },
      ],
    },
  },
  {
    position: 42,
    screenId: 'B2-01-S43-MARGE-2024',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s43-marge-2024',
        type: 'reflection',
        question:
          '289 800 / 1 050 000 : quel taux de marge et quelle phrase de sens ?',
        placeholder: 'Estimation, calcul, pourcentage et unité de sens…',
        context:
          'Le taux de marge compare la marge réalisée au chiffre d’affaires de la même période et du même périmètre.',
        competency: 'C3 · Agrégation',
      },
    },
    corrections: {
      expected:
        '289 800 / 1 050 000 = 27,60 %. Pour 100 € de CA, l’entreprise conserve en moyenne 27,60 € de marge selon cette définition.',
      nextAction:
        'Vérifier la définition de marge avant de comparer deux exercices.',
    },
  },
  {
    position: 43,
    screenId: 'B2-01-S44-MARGE-2025',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s44-marge-2025',
        type: 'reflection',
        question: 'Quel est le taux 2025 et quel est l’écart avec 2024 ?',
        placeholder:
          'Taux 2025, écart en points, évolution relative facultative…',
        context:
          'La comparaison 2024/2025 doit séparer la valeur de marge, le taux de marge et la progression du chiffre d’affaires.',
        competency: 'C3 · Agrégation',
      },
    },
    corrections: {
      expected:
        '291 000 / 1 150 000 = 25,30 %. L’écart est de -2,30 points par rapport à 27,60 %.',
      nextAction:
        'Chercher un effet de mix ou de coûts avant d’écrire une cause certaine.',
    },
  },
  {
    position: 44,
    screenId: 'B2-01-S45-RECOMMANDATION',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s45-recommandation',
        type: 'reflection',
        question:
          'Rédigez une recommandation : constat, cause plausible, preuve manquante et action.',
        placeholder: 'La marge… ; le taux… ; vérifier…',
        context:
          'Une recommandation professionnelle sépare toujours le constat calculé, l’hypothèse et le contrôle à réaliser.',
        competency: 'C5 · Communiquer une conclusion contrôlable',
      },
    },
    corrections: {
      expected:
        'Constat : marge +1 200 €, taux -2,30 points. Hypothèse : CA ou mix en hausse plus rapide. Preuve : détail par canal et coûts.',
      nextAction:
        'Ne pas transformer une hypothèse plausible en cause prouvée.',
    },
  },
  {
    position: 45,
    screenId: 'B2-01-S46-VOTE-1',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s46-peer-vote-1',
        type: 'quiz',
        question:
          'Le taux global baisse alors que chaque taux local est stable. Quelle explication est possible ?',
        options: [
          'Une erreur certaine',
          'Un changement de mix',
          'Une baisse de tous les volumes',
          'Aucune explication',
        ],
        context:
          'Un taux global est une moyenne pondérée. Le poids d’un canal peut changer même si son propre taux reste identique.',
        competency: 'C3 · Agrégation : prévoir l’effet d’un changement de mix',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'Si un canal moins margé prend plus de poids, il tire le taux global vers le bas. La moyenne simple ne tient pas compte des chiffres d’affaires.',
      nextAction:
        'Calculer chaque poids : CA du canal / CA total, puis vérifier la somme des marges.',
    },
  },
  {
    position: 46,
    screenId: 'B2-01-S47-PAIRS',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s47-peer-argument',
        type: 'reflection',
        question:
          'Expliquez avec deux canaux comment un changement de poids peut faire baisser le taux global.',
        placeholder: 'Poids × taux local…',
        context:
          'L’objectif n’est pas seulement de calculer une moyenne. Il faut expliquer pourquoi le poids d’un canal déplace le résultat global.',
        competency: 'C3 · Agrégation',
      },
    },
    corrections: {
      expected:
        'Un canal à 16 % qui passe de 20 % à 50 % du CA tire le taux global vers le bas si les autres taux restent constants.',
      nextAction:
        'Comparer prévision et calcul, puis nommer le poids qui a changé.',
    },
  },
  {
    position: 47,
    screenId: 'B2-01-S48-VOTE-2',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s48-peer-vote-2',
        type: 'quiz',
        question:
          'Le taux global baisse alors que chaque taux local est stable. Quel argument faut-il mobiliser ?',
        options: [
          'Les poids des canaux',
          'La couleur du graphique',
          'Le nombre de canaux seulement',
        ],
        context:
          'Pour défendre une analyse devant un responsable, l’argument doit relier les taux locaux, les poids et le calcul global.',
        competency: 'C3 · Agrégation : expliquer un résultat',
      },
    },
    corrections: {
      correctIndex: 0,
      explanation:
        'Le changement de poids est la preuve du mécanisme. La couleur ou le nombre de canaux ne permet pas d’expliquer la variation.',
      nextAction:
        'Illustrer le raisonnement avec un cas chiffré à deux canaux.',
    },
  },
  {
    position: 48,
    screenId: 'B2-01-S49-DEBRIEF',
    renderer: 'comparison',
    props: {
      title: 'Passer d’une intuition à une preuve',
      subtitle:
        'Un argument comptable doit contenir un mécanisme et un exemple chiffré vérifiable.',
      note: 'Changer de réponse n’est pas l’objectif. L’objectif est de pouvoir expliquer pourquoi la réponse tient avant de passer au contrôle comptable.',
      columns: [
        {
          label: 'Argument correct',
          tone: 'success',
          items: ['Deux taux locaux constants', 'Poids modifiés'],
        },
        {
          label: 'Argument incomplet',
          tone: 'warning',
          items: ['Une intuition', 'Aucun exemple chiffré'],
        },
        {
          label: 'Argument faux',
          tone: 'danger',
          items: ['Moyenne simple', 'Poids ignorés'],
        },
      ],
    },
  },
  {
    position: 49,
    screenId: 'B2-01-S50-PACIOLI',
    renderer: 'image-left',
    props: {
      imageAlt: 'Portrait historique de Luca Pacioli',
      title: '1494 : une méthode de contrôle',
      subtitle: 'Les traces comptables doivent se répondre.',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/a/a4/Luca_Pacioli.jpg',
      paragraphs: [
        'Luca Pacioli formalise dans la Summa la tenue en partie double.',
        'Après le portefeuille de ventes, la même discipline s’applique aux écritures : une concordance organise le contrôle, mais un total exact ne garantit pas des lignes exactes.',
      ],
      nestedQuiz: {
        id: 'b2-s50-pacioli',
        type: 'quiz',
        question:
          'Une concordance des totaux signifie-t-elle qu’il n’y a aucune erreur ?',
        options: [
          'Oui',
          'Non, des erreurs peuvent se compenser',
          'Oui, si le total est signé',
        ],
        context:
          'Le rapprochement comptable vérifie une relation entre une écriture et une pièce source. Il ne se limite pas à regarder si deux totaux se ressemblent.',
        competency:
          'C5 · Contrôle et preuve : distinguer concordance et exactitude',
      },
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Luca_Pacioli.jpg',
        label: 'Voir l’image originale · Wikimedia Commons',
      },
    },
    corrections: {
      nestedQuiz: {
        correctIndex: 1,
        explanation:
          'Des erreurs opposées peuvent se compenser. La concordance des totaux est un signal de cohérence, pas une preuve ligne par ligne.',
        nextAction:
          'Rapprocher les lignes et conserver la pièce probante indépendante.',
      },
    },
  },
  {
    position: 50,
    screenId: 'B2-01-S51-MISSION',
    renderer: 'comparison',
    props: {
      title: 'Mission de contrôle : choisir le premier test',
      subtitle:
        'On commence par le contrôle qui réduit le plus vite l’incertitude avec un coût raisonnable.',
      note: 'Un indice aide à chercher. Une pièce source permet de trancher.',
      columns: [
        {
          label: 'Rapprocher ligne par ligne',
          tone: 'success',
          items: ['Localise l’écart', 'Contrôle le moins coûteux'],
        },
        {
          label: 'Recalculer la TVA',
          tone: 'neutral',
          items: ['Utile après le HT', 'Ne localise pas F004'],
        },
        {
          label: 'Tester le multiple de 9',
          tone: 'warning',
          items: ['Indice possible', 'Pas une preuve'],
        },
        {
          label: 'Lire toutes les pièces',
          tone: 'info',
          items: ['Coût élevé', 'À cibler après localisation'],
        },
      ],
    },
  },
  {
    position: 51,
    screenId: 'B2-01-S52-CONTROLE-GLOBAL',
    renderer: 'table',
    props: {
      title: 'Contrôle global : calculer l’écart',
      subtitle:
        'Le total permet de détecter une incohérence. Il ne permet pas encore de localiser l’erreur.',
      note: 'Écart total : 48 795 € - 48 705 € = +90 €. L’étape suivante est le rapprochement ligne par ligne.',
      columns: [
        {
          key: 'id',
          label: 'Ligne',
        },
        {
          key: 'piece',
          label: 'Pièces HT',
        },
        {
          key: 'grandLivre',
          label: 'Grand livre HT',
        },
        {
          key: 'ecart',
          label: 'Grand livre - pièces',
        },
      ],
      rows: [
        {
          id: 'F001',
          piece: '12 000 €',
          grandLivre: '12 000 €',
          ecart: '0 €',
        },
        {
          id: 'F002',
          piece: '8 500 €',
          grandLivre: '8 500 €',
          ecart: '0 €',
        },
        {
          id: 'F003',
          piece: '15 865 €',
          grandLivre: '15 865 €',
          ecart: '0 €',
        },
        {
          id: 'F004',
          piece: '12 340 €',
          grandLivre: '12 430 €',
          ecart: '+90 €',
        },
      ],
    },
  },
  {
    position: 52,
    screenId: 'B2-01-S53-LOCALISER',
    renderer: 'table',
    props: {
      title: 'Filtrer les lignes non concordantes',
      subtitle:
        'Le filtre transforme un écart global en piste de contrôle précise.',
      columns: [
        {
          key: 'id',
          label: 'Ligne',
        },
        {
          key: 'piece',
          label: 'Pièce',
        },
        {
          key: 'grandLivre',
          label: 'Grand livre',
        },
        {
          key: 'ecart',
          label: 'Écart',
        },
      ],
      rows: [
        {
          id: 'F001',
          piece: '12 000 €',
          grandLivre: '12 000 €',
          ecart: '0 €',
        },
        {
          id: 'F002',
          piece: '8 500 €',
          grandLivre: '8 500 €',
          ecart: '0 €',
        },
        {
          id: 'F003',
          piece: '15 865 €',
          grandLivre: '15 865 €',
          ecart: '0 €',
        },
        {
          id: 'F004',
          piece: '12 340 €',
          grandLivre: '12 430 €',
          ecart: '+90 €',
        },
      ],
    },
  },
  {
    position: 53,
    screenId: 'B2-01-S54-MULTIPLE-NEUF',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s54-multiple-neuf',
        type: 'quiz',
        question:
          'Un écart de 90 €, divisible par 9, prouve-t-il une transposition ?',
        options: [
          'Oui',
          'Non, c’est un indice à confirmer',
          'Seulement si le total concorde',
        ],
        context:
          'Le test du multiple de 9 peut orienter une recherche d’erreur de transposition, mais il ne localise ni ne prouve l’anomalie.',
        competency: 'C5 · Contrôle et preuve : hiérarchiser les indices',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'Un indice réduit l’espace de recherche. Seule la comparaison avec la pièce source peut confirmer la valeur attendue.',
      nextAction:
        'Passer du signal numérique au rapprochement de la ligne et de la pièce.',
    },
  },
  {
    position: 54,
    screenId: 'B2-01-S55-F004',
    renderer: 'table',
    props: {
      title: 'Prouver avec F004',
      subtitle:
        'La pièce source est indépendante de l’écriture contrôlée. Elle permet de dire quelle valeur doit être retenue.',
      columns: [
        {
          key: 'champ',
          label: 'Champ de la pièce',
        },
        {
          key: 'valeur',
          label: 'Valeur',
        },
      ],
      rows: [
        {
          champ: 'Pièce validée',
          valeur: '12 340 € HT',
        },
        {
          champ: 'TVA à 20 %',
          valeur: '2 468 €',
        },
        {
          champ: 'Total TTC',
          valeur: '14 808 €',
        },
        {
          champ: 'Écriture saisie',
          valeur: '12 430 € HT',
        },
      ],
    },
  },
  {
    position: 55,
    screenId: 'B2-01-S56-TVA',
    renderer: 'comparison',
    props: {
      title: 'Recalculer TVA et TTC',
      subtitle:
        'Après correction du HT, on reconstruit la TVA et le TTC puis on effectue un contrôle inverse.',
      note: 'Un montant TTC exact ne corrige pas une base HT erronée. La chaîne doit être recalculée à partir de la valeur prouvée.',
      columns: [
        {
          label: 'Base corrigée',
          tone: 'info',
          items: ['Total HT : 48 705 €', 'Taux TVA : 20 %'],
        },
        {
          label: 'Calcul',
          tone: 'neutral',
          items: ['TVA : 9 741 €', 'TTC : 58 446 €'],
        },
        {
          label: 'Contrôle inverse',
          tone: 'success',
          items: ['58 446 - 9 741', '= 48 705 € HT'],
        },
      ],
    },
  },
  {
    position: 56,
    screenId: 'B2-01-S57-COMPENSATION',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s57-compensation',
        type: 'quiz',
        question:
          'Le total concorde, mais F002 est à +100 € et F003 à -100 €. Peut-on valider ?',
        options: ['Oui', 'Non, les erreurs se compensent'],
        context:
          'Un total exact peut masquer deux écarts de sens contraire. C’est pourquoi le contrôle doit descendre au niveau des lignes.',
        competency: 'C5 · Contrôle et preuve : repérer les compensations',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'F002 à +100 € et F003 à -100 € ramènent le total à zéro, mais chaque écriture reste fausse.',
      nextAction:
        'Filtrer les écarts non nuls puis rechercher la preuve source de chaque ligne.',
    },
  },
  {
    position: 57,
    screenId: 'B2-01-S58-ALERTE',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s58-alert',
        type: 'reflection',
        question: 'Rédigez l’alerte professionnelle à partir de l’écart F004.',
        placeholder:
          'Constat, attendu, observé, écart, hypothèse, preuve, action…',
        context:
          'Une alerte comptable doit permettre à un tiers de refaire le contrôle sans vous demander ce que vous aviez en tête.',
        competency: 'C5 · Contrôle et preuve',
      },
    },
    corrections: {
      expected:
        'F004 est enregistrée à 12 430 € HT contre 12 340 € HT sur la pièce, soit +90 €. Vérifier la pièce et corriger l’écriture avant validation.',
      nextAction:
        'Joindre la pièce source et conserver le calcul HT, TVA et TTC.',
    },
  },
  {
    position: 58,
    screenId: 'B2-01-S59-DEFI',
    renderer: 'hero',
    props: {
      title: 'Mission intégrée : prioriser ce qui peut changer une décision',
      subtitle:
        'Tableau de bord Nova Services · trimestre 2 · six indicateurs à sécuriser',
      bullets: [
        'Trois alertes concernent le sens, le calcul, la représentation ou la preuve.',
        'Objectif : choisir trois contrôles et expliquer leur ordre.',
      ],
    },
  },
  {
    position: 59,
    screenId: 'B2-01-S60-PRIORITES',
    renderer: 'grid',
    props: {
      title: 'Prioriser les anomalies',
      subtitle:
        'Choisissez trois priorités et reliez chacune à la compétence concernée.',
      items: [
        {
          title: 'Taux sans unité',
          description: 'Identifier la mesure, la période et la base.',
        },
        {
          title: 'Axe tronqué',
          description: 'Comparer l’amplitude affichée à l’écart réel.',
        },
        {
          title: 'Taux cumulés additionnés',
          description: 'Recalculer avec des coefficients successifs.',
        },
        {
          title: 'Marge en hausse, taux en baisse',
          description: 'Examiner les poids et le mix des ventes.',
        },
        {
          title: 'Total exact, lignes fausses',
          description: 'Rapprocher les écritures de la pièce source.',
        },
        {
          title: 'Donnée correcte',
          description: 'Aucune anomalie à traiter',
        },
      ],
    },
  },
  {
    position: 60,
    screenId: 'B2-01-S61-CONTROLE',
    renderer: 'comparison',
    props: {
      title: 'Choisir le contrôle discriminant',
      columns: [
        {
          label: 'Donnée sans sens',
          tone: 'info',
          items: ['Vérifier les métadonnées', 'Mesure, unité, période, source'],
        },
        {
          label: 'Calcul suspect',
          tone: 'warning',
          items: [
            'Recalculer les coefficients',
            'Comparer au résultat affiché',
          ],
        },
        {
          label: 'Écart comptable',
          tone: 'success',
          items: [
            'Rapprocher les lignes et pièces',
            'Chercher une preuve indépendante',
          ],
        },
      ],
    },
  },
  {
    position: 61,
    screenId: 'B2-01-S62-DECISION',
    renderer: 'reflection',
    props: {
      promptData: {
        id: 'b2-s62-decision',
        type: 'reflection',
        question:
          'Je recommande… parce que… Je vérifierais… La limite principale est…',
        placeholder:
          'Une décision, un calcul, une preuve indépendante et une limite…',
        context:
          'Une décision de gestion défendable relie le sens du chiffre, la méthode de calcul, la preuve et la limite de l’analyse.',
        competency: 'C1 à C5 · Synthèse professionnelle',
      },
    },
    corrections: {
      expected:
        'Prioriser une alerte, donner le calcul ou le rapprochement, citer la source indépendante et expliciter ce qui reste à vérifier.',
      nextAction:
        'Écrire comme dans une note de contrôle : constat, analyse, preuve, action, limite.',
    },
  },
  {
    position: 62,
    screenId: 'B2-01-S63-FLASH-POINTS',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s63-flash-points',
        type: 'quiz',
        question: 'Un taux passe de 12 % à 15 %. Quel écart en points ?',
        options: ['3 points', '25 points', '0,25 point'],
        context:
          'En contrôle de gestion, un écart entre deux taux n’est pas toujours une évolution en pourcentage. Il faut nommer précisément la comparaison.',
        competency:
          'C2 · Transformation : distinguer points et variation relative',
      },
    },
    corrections: {
      correctIndex: 0,
      explanation:
        '15 % - 12 % = +3 points. Le taux lui-même a augmenté de 3 / 12 = +25 % en relatif.',
      nextAction:
        'Écrire l’unité dans la conclusion : points pour l’écart, % pour l’évolution relative.',
    },
  },
  {
    position: 63,
    screenId: 'B2-01-S64-FLASH-PREUVE',
    renderer: 'quiz',
    props: {
      questionData: {
        id: 'b2-s64-flash-preuve',
        type: 'quiz',
        question: 'Un multiple de 9 suffit-il à prouver une transposition ?',
        options: ['Oui', 'Non, il faut rapprocher une pièce source'],
        context:
          'Le contrôle par 9 est un outil de repérage rapide, pas une pièce justificative utilisable seul dans un dossier d’audit.',
        competency: 'C5 · Contrôle et preuve : choisir une preuve indépendante',
      },
    },
    corrections: {
      correctIndex: 1,
      explanation:
        'La divisibilité par 9 peut signaler une transposition, mais elle ne distingue pas toutes les erreurs possibles.',
      nextAction:
        'Rapprocher l’écriture de la pièce source et documenter l’écart trouvé.',
    },
  },
  {
    position: 64,
    screenId: 'B2-01-S65-MAITRISE',
    renderer: 'grid',
    props: {
      title: 'Carte de maîtrise',
      subtitle:
        'Les cinq compétences se lisent comme une carte de progression : comprendre, appliquer, justifier puis transférer.',
      items: [
        {
          title: 'Sens du chiffre',
          description: 'Mesure et contexte',
          back: 'Prochaine activité : habiller un indicateur.',
        },
        {
          title: 'Transformation',
          description: 'Taux et coefficients',
          back: 'Prochaine activité : refaire un calcul inverse.',
        },
        {
          title: 'Agrégation',
          description: 'Valeur et mix',
          back: 'Prochaine activité : comparer les poids.',
        },
        {
          title: 'Représentation',
          description: 'Axes et graphiques',
          back: 'Prochaine activité : auditer une échelle.',
        },
        {
          title: 'Contrôle et preuve',
          description: 'Source et preuve',
          back: 'Prochaine activité : rapprocher F004.',
        },
      ],
    },
  },
  {
    position: 65,
    screenId: 'B2-01-S66-SORTIE',
    renderer: 'cta',
    props: {
      title: 'Du cours au poste de travail',
      description:
        'La méthode est posée. Les six écrans suivants la traduisent en pratiques pour Excel, la BI et l’IA, avec les mêmes exigences de preuve.',
      ctaLabel: 'Ouvrir la boîte à outils',
      ctaHref: '#b2-01-s67-boite-a-outils',
    },
  },
  {
    position: 66,
    screenId: 'B2-01-S67-BOITE-A-OUTILS',
    renderer: 'guide',
    props: {
      title: 'Le cycle de travail du futur comptable',
      subtitle:
        'Le logiciel accélère la manipulation. Le professionnel reste responsable du sens, du contrôle et de la décision.',
      context:
        'Une mission réelle suit une chaîne de preuve. Elle commence dans une source, traverse un traitement documenté et se termine dans une conclusion que quelqu’un d’autre peut refaire.',
      takeaway:
        'La compétence ne se résume pas à trouver le bon résultat. Elle consiste à produire une information fiable et réutilisable.',
      nextAction:
        'Conserver les étapes de transformation et écrire une phrase de conclusion avec son unité.',
      items: [
        {
          title: 'Qualifier la source',
          description:
            'Identifier qui produit la donnée, à quelle date et avec quelle définition.',
          detail:
            'Exemple : grand livre, export de caisse, facture, fichier bancaire ou donnée statistique.',
        },
        {
          title: 'Nettoyer sans détruire',
          description:
            'Corriger les types, doublons et libellés tout en conservant la source originale.',
          detail:
            'Le nettoyage doit être rejouable. Une correction manuelle non tracée est une nouvelle zone de risque.',
        },
        {
          title: 'Calculer avec une base explicite',
          description:
            'Choisir la formule, l’unité, l’arrondi et le dénominateur qui répondent à la question.',
          detail:
            'Un tableur n’explique pas une formule : le professionnel doit pouvoir la défendre.',
        },
        {
          title: 'Représenter pour décider',
          description:
            'Construire un tableau ou un graphique qui montre la relation utile sans exagérer l’écart.',
          detail:
            'Titre, axes, période, source et vue tabulaire restent disponibles.',
        },
        {
          title: 'Rapprocher et conclure',
          description:
            'Comparer au document probant, qualifier la limite et recommander une action.',
          detail:
            'Une alerte utile dit ce qui est observé, ce qui est attendu et ce qu’il faut vérifier.',
        },
      ],
    },
  },
  {
    position: 67,
    screenId: 'B2-01-S68-TABLEUR-BI',
    renderer: 'guide',
    props: {
      title: 'Du fichier brut au tableau de bord',
      subtitle:
        'Excel, Power Query, Power Pivot et Power BI répondent à des niveaux différents du même problème.',
      context:
        'Le tableur reste un outil de proximité. Pour éviter le copier-coller fragile, séparez la donnée source, la transformation, le modèle, la mesure et la restitution.',
      takeaway:
        'La valeur de la BI vient de la chaîne de données, pas du nombre de graphiques.',
      nextAction:
        'Nommer la source, la date de rafraîchissement et la définition de chaque KPI.',
      items: [
        {
          title: 'Excel Table',
          description:
            'Structurer les données en colonnes avec une ligne d’en-tête et des types cohérents.',
          detail:
            'Pas de cellules fusionnées dans la table source. Une ligne = une observation.',
        },
        {
          title: 'Power Query',
          description:
            'Connecter, transformer, combiner puis actualiser les données.',
          detail:
            'Les étapes restent visibles et rejouables quand le fichier source change.',
        },
        {
          title: 'Tableau croisé dynamique',
          description:
            'Résumer les montants par période, canal, compte ou centre de responsabilité.',
          detail:
            'Les regroupements répondent à une question. Ils ne remplacent pas la définition de l’indicateur.',
        },
        {
          title: 'Modèle et mesures',
          description:
            'Relier plusieurs tables et distinguer une mesure d’une colonne calculée.',
          detail:
            'Le modèle évite de sommer deux fois le même fait ou de mélanger des grains différents.',
        },
        {
          title: 'Dashboard contrôlable',
          description:
            'Publier une vue avec filtres, unités, date de rafraîchissement et source.',
          detail:
            'Une belle vue sans traçabilité reste une interface, pas une preuve.',
        },
      ],
    },
  },
  {
    position: 68,
    screenId: 'B2-01-S69-FORMULES',
    renderer: 'guide',
    props: {
      title: 'Les formules qu’il faut savoir expliquer',
      subtitle:
        'Un futur comptable n’a pas besoin de mémoriser toutes les fonctions. Il doit savoir choisir, tester et documenter les bonnes.',
      context:
        'La fonction n’est jamais la méthode complète. Une formule fiable précise ses plages, sa base, ses unités et le contrôle qui permet de repérer une erreur.',
      takeaway:
        'Une formule est professionnelle quand son résultat, sa base et son contrôle sont lisibles par un tiers.',
      nextAction:
        'Ajouter dans le classeur une feuille Sources, une feuille Calculs et une feuille Contrôles.',
      items: [
        {
          title: 'RECHERCHEX',
          description:
            'Retrouver une donnée selon une clé et gérer explicitement l’absence de correspondance.',
          detail:
            'Contrôle : tester une clé existante, une clé absente et un doublon.',
        },
        {
          title: 'SOMME.SI.ENS',
          description:
            'Agréger un montant selon plusieurs critères comme période, compte ou canal.',
          detail:
            'Contrôle : vérifier le total sans filtre et la cohérence des critères.',
        },
        {
          title: 'SIERREUR',
          description:
            'Gérer une erreur technique sans masquer une anomalie métier.',
          detail:
            'Une cellule vide ou zéro par défaut peut cacher une clé manquante : contrôler avant de neutraliser.',
        },
        {
          title: 'ARRONDI',
          description:
            'Choisir le moment de l’arrondi et préserver la précision interne.',
          detail:
            'Le registre de référence arrondit à l’affichage, pas à chaque étape du calcul.',
        },
        {
          title: 'Contrôle inverse',
          description:
            'Repartir du résultat pour vérifier la formule avec une opération indépendante.',
          detail: 'Exemple : 120 000 × 1,15 doit redonner 138 000.',
        },
      ],
    },
  },
  {
    position: 69,
    screenId: 'B2-01-S70-IA-CONTROLE',
    renderer: 'guide',
    props: {
      title: 'IA : accélérer la préparation, jamais déléguer le jugement',
      subtitle:
        'L’IA générative peut proposer une structure ou une variante. Elle ne valide ni un chiffre, ni une pièce, ni une conclusion.',
      context:
        'Le cadre d’usage français demande une plus-value pédagogique, la protection des données et la vérification des productions. Pour un comptable, cela rejoint les règles de confidentialité et de contrôle interne.',
      takeaway:
        'L’IA peut réduire le temps de préparation. La responsabilité de la preuve reste humaine.',
      nextAction:
        'Ne jamais envoyer une donnée comptable sensible et toujours croiser la réponse avec une source fiable.',
      items: [
        {
          title: 'Cadrer la demande',
          description:
            'Décrire le rôle, la question, le format attendu et les contraintes de calcul.',
          detail:
            'Demander une méthode vérifiable, pas une réponse persuasive.',
        },
        {
          title: 'Anonymiser les données',
          description:
            'Remplacer noms, numéros de compte, clients et montants réels par des données fictives.',
          detail:
            'Aucune donnée confidentielle ou personnelle dans un service grand public.',
        },
        {
          title: 'Faire challenger le raisonnement',
          description:
            'Demander les hypothèses, les unités, les cas limites et les contrôles possibles.',
          detail:
            'Une IA est utile comme contradicteur, pas comme source primaire.',
        },
        {
          title: 'Vérifier avec le tableur',
          description:
            'Recalculer dans Excel ou un outil déterministe et comparer aux documents sources.',
          detail:
            'Les résultats numériques doivent être reproductibles hors de la conversation.',
        },
        {
          title: 'Tracer l’usage',
          description:
            'Conserver la question, la version retenue, les corrections humaines et la source finale.',
          detail:
            'Le lecteur doit savoir ce qui vient de l’outil et ce qui vient du professionnel.',
        },
      ],
    },
  },
  {
    position: 70,
    screenId: 'B2-01-S71-SKILLS-IA',
    renderer: 'guide',
    props: {
      title: 'Les skills IA du comptable augmenté',
      subtitle:
        'Le bon usage n’est pas un prompt isolé. C’est une nouvelle manière de cadrer, vérifier et communiquer le travail.',
      context:
        'Les compétences utiles combinent culture de la donnée, esprit critique et maîtrise du métier. Elles sont transférables d’un outil d’IA à l’autre.',
      takeaway:
        'Le comptable de demain ne délègue pas son jugement. Il augmente sa capacité à tester, expliquer et décider.',
      nextAction:
        'Pour chaque suggestion d’IA, écrire : source, calcul, contrôle, limite.',
      items: [
        {
          title: 'Cadrer',
          description:
            'Transformer une demande vague en question de gestion mesurable.',
          detail:
            'Quel indicateur, quelle période, quelle base et quelle décision ?',
        },
        {
          title: 'Contextualiser',
          description:
            'Fournir les définitions et les contraintes qui empêchent une réponse générique.',
          detail:
            'Le vocabulaire comptable et le plan de contrôle doivent être explicites.',
        },
        {
          title: 'Challenger',
          description:
            'Chercher les hypothèses cachées, les contre-exemples et les données manquantes.',
          detail:
            'Une réponse fluide peut être mathématiquement ou juridiquement fausse.',
        },
        {
          title: 'Tracer',
          description:
            'Documenter la source, la transformation, l’aide reçue et la validation.',
          detail:
            'La traçabilité rend la reprise possible par un collègue ou un auditeur.',
        },
        {
          title: 'Décider',
          description:
            'Formuler une recommandation proportionnée à la preuve disponible.',
          detail:
            'Savoir dire « je ne peux pas conclure » est une compétence professionnelle.',
        },
      ],
    },
  },
  {
    position: 71,
    screenId: 'B2-01-S72-RESSOURCES',
    renderer: 'grid',
    props: {
      title: 'Ressources pour continuer',
      subtitle:
        'Les outils et cadres de référence qui prolongent ce cours. Ouvrez les ressources selon votre objectif.',
      items: [
        {
          title: 'Power Query',
          description:
            'Connecter, transformer, combiner et actualiser les données dans Excel.',
          href: 'https://support.microsoft.com/en-us/Excel/power-query-for-excel-help',
          external: true,
        },
        {
          title: 'Tableaux croisés',
          description:
            'Résumer et analyser des données par comparaison, tendance et regroupement.',
          href: 'https://support.microsoft.com/en-us/excel/get-started/create-a-pivottable-to-analyze-worksheet-data',
          external: true,
        },
        {
          title: 'RECHERCHEX',
          description:
            'Retrouver une valeur par clé sans perdre de vue les cas absents et les versions Excel.',
          href: 'https://support.microsoft.com/en-us/excel/functions/xlookup-function',
          external: true,
        },
        {
          title: 'Cadre français de l’IA',
          description:
            'Protection des données, vérification et usages autorisés en éducation.',
          href: 'https://www.education.gouv.fr/cadre-d-usage-de-l-ia-en-education-450647',
          external: true,
        },
        {
          title: 'IPC Insee',
          description:
            'Consulter une série officielle d’indice des prix à la consommation et son périmètre.',
          href: 'https://www.insee.fr/fr/statistiques/serie/001765618',
          external: true,
        },
        {
          title: 'Compétences IA UNESCO',
          description:
            'Comprendre, appliquer et créer avec une IA responsable et critique.',
          href: 'https://www.unesco.org/en/articles/ai-competency-framework-students?hub=66973',
          external: true,
        },
        {
          title: 'WCAG 2.2',
          description:
            'Rendre les contenus web et les graphiques utilisables par tous.',
          href: 'https://www.w3.org/TR/WCAG22/',
          external: true,
        },
      ],
    },
  },
] as const;
