export const REFERENTIEL_B2 = {
  niveau: 'B2',
  intitule: 'Mathématiques appliquées — parcours B2',
  source: {
    reference:
      'Arrêté du 8 juillet 2024 modifiant le BTS comptabilité et gestion',
    url: 'https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049926379',
    objectifs: [
      'Modéliser des situations issues de la gestion à partir de données chiffrées.',
      'Raisonner, calculer, contrôler la vraisemblance et communiquer un résultat.',
      'Utiliser un tableur, une calculatrice et des représentations numériques ou graphiques.',
    ],
  },
  objectifsEtat: {
    organisationContenus: [
      'Une étude des suites et des fonctions usuelles dont la maîtrise est nécessaire à ce niveau.',
      'Une étude de séries statistiques à deux variables privilégiant les exemples issus de l’économie et de la gestion.',
      'Une initiation au calcul des propositions et des prédicats, en liaison avec l’étude du modèle relationnel en gestion.',
      'Une initiation au calcul des probabilités, centrée sur la maîtrise et l’exploitation des lois fondamentales, permettant de modéliser des phénomènes aléatoires.',
      'Une valorisation des aspects numériques et graphiques pour l’ensemble du programme, une initiation à quelques méthodes élémentaires de l’analyse numérique et l’utilisation à cet effet des moyens informatiques appropriés : calculatrice programmable à écran graphique, ordinateur muni d’un tableur, de logiciels de calcul formel et d’applications (modélisation, simulation, programmation...).',
    ],
    origine:
      'Extrait des objectifs d’apprentissage d’État fourni pour le référentiel produit ; les cinq modules sont recoupés avec le programme officiel du BTS comptabilité et gestion.',
    organisationEtudes:
      '1,5 heure + 0,5 heure en première et en seconde années.',
    modules: [
      "Traitement de l'information chiffrée",
      'Calcul des propositions et des prédicats',
      'Statistique descriptive',
      'Analyse de phénomènes exponentiels',
      'Probabilités 1',
    ],
  },
  poles: [
    {
      module: 'traitement-information-chiffree',
      titre: "Traitement de l'information chiffrée",
      objectif:
        'Lire, transformer, contrôler et interpréter une information chiffrée dans une situation de gestion.',
    },
    {
      module: 'propositions-predicats',
      titre: 'Calcul des propositions et des prédicats',
      objectif:
        'Formaliser une règle, tester sa valeur de vérité et relier la logique au modèle relationnel.',
    },
    {
      module: 'statistique-descriptive',
      titre: 'Statistique descriptive',
      objectif:
        'Décrire une série, représenter deux variables et produire une prévision argumentée.',
    },
    {
      module: 'phenomenes-exponentiels',
      titre: 'Analyse de phénomènes exponentiels',
      objectif:
        'Modéliser des évolutions discrètes et continues avec suites et fonctions usuelles.',
    },
    {
      module: 'probabilites-1',
      titre: 'Probabilités 1',
      objectif:
        'Décrire un risque, exploiter une loi fondamentale et interpréter une probabilité.',
    },
  ],
  cours: [
    {
      code: 'B2-01',
      slug: 'b2-01-traitement-information-chiffree',
      module: 'traitement-information-chiffree',
      titre: "Lire et contrôler l'information chiffrée",
      objectifs: [
        'Passer d’une partie à une proportion puis à un pourcentage.',
        'Choisir le bon total de référence et contrôler un ordre de grandeur.',
        'Présenter un résultat chiffré avec son unité et son interprétation.',
      ],
    },
    {
      code: 'B2-02',
      slug: 'b2-02-proportions-et-indices',
      module: 'traitement-information-chiffree',
      titre: 'Proportions, pourcentages et indices base 100',
      objectifs: [
        'Calculer une part',
        'Construire et lire un indice',
        'Comparer des populations.',
      ],
    },
    {
      code: 'B2-03',
      slug: 'b2-03-tableaux-et-controles',
      module: 'traitement-information-chiffree',
      titre: 'Tableaux de données et contrôles de cohérence',
      objectifs: [
        'Organiser des données',
        'Vérifier des totaux',
        'Repérer une anomalie.',
      ],
    },
    {
      code: 'B2-04',
      slug: 'b2-04-logique-des-regles',
      module: 'propositions-predicats',
      titre: 'Traduire une règle en logique',
      objectifs: [
        'Identifier une proposition',
        'Utiliser les connecteurs',
        'Évaluer une condition.',
      ],
    },
    {
      code: 'B2-05',
      slug: 'b2-05-predicats-et-donnees',
      module: 'propositions-predicats',
      titre: 'Prédicats, filtres et modèle relationnel',
      objectifs: [
        'Distinguer variable et constante',
        'Lire un filtre',
        'Relier tables et critères.',
      ],
    },
    {
      code: 'B2-06',
      slug: 'b2-06-series-et-indicateurs',
      module: 'statistique-descriptive',
      titre: 'Séries statistiques et indicateurs',
      objectifs: [
        'Calculer moyenne et médiane',
        'Mesurer la dispersion',
        'Choisir un indicateur.',
      ],
    },
    {
      code: 'B2-07',
      slug: 'b2-07-deux-variables-et-ajustement',
      module: 'statistique-descriptive',
      titre: 'Deux variables, nuage et ajustement',
      objectifs: [
        'Lire un nuage',
        'Déterminer un ajustement',
        'Interpoler et extrapoler avec prudence.',
      ],
    },
    {
      code: 'B2-08',
      slug: 'b2-08-suites-et-evolutions',
      module: 'phenomenes-exponentiels',
      titre: 'Suites arithmétiques et géométriques',
      objectifs: [
        'Identifier une évolution',
        'Calculer un terme',
        'Interpréter une raison.',
      ],
    },
    {
      code: 'B2-09',
      slug: 'b2-09-finance-et-exponentielle',
      module: 'phenomenes-exponentiels',
      titre: 'Mathématiques financières et fonction exponentielle',
      objectifs: [
        'Calculer une valeur acquise',
        'Comparer des scénarios',
        'Justifier une décision.',
      ],
    },
    {
      code: 'B2-10',
      slug: 'b2-10-propositions-et-risque',
      module: 'probabilites-1',
      titre: 'Événements, arbres et conditionnement',
      objectifs: [
        'Décrire un événement',
        'Construire un arbre',
        'Calculer une probabilité conditionnelle.',
      ],
    },
    {
      code: 'B2-11',
      slug: 'b2-11-independance-et-lois',
      module: 'probabilites-1',
      titre: 'Indépendance et lois fondamentales',
      objectifs: [
        'Tester une indépendance',
        'Choisir une loi',
        'Interpréter un risque.',
      ],
    },
    {
      code: 'B2-12',
      slug: 'b2-12-modeliser-simuler-communiquer',
      module: 'probabilites-1',
      titre: 'Modéliser, simuler et communiquer une décision',
      objectifs: [
        'Construire un modèle',
        'Simuler avec un outil',
        'Contrôler et présenter une conclusion.',
      ],
    },
  ],
} as const;
