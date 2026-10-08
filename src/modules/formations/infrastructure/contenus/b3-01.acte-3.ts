import { CLASSEURS_B3_01, HISTOIRES_B3_01 } from './b3-01.donnees';
import { questionChiffree } from './b3-01.questions';
import * as moteur from './briques';

export const ACTE_3: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B3-01-A3-01-GRAPHIQUE-TROMPEUR',
      titre: 'Un graphique de la direction',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['choix-du-graphique'],
      notes: moteur.puces(
        'Projeter sans commentaire ; laisser 30 secondes de lecture avant le vote.',
        'Ne pas montrer l’axe du doigt : c’est l’objet du vote.',
      ),
    },
    'chart',
    {
      title: 'Rennes, loin derrière Nantes',
      caption: 'Diapositive préparée pour le comité de direction',
      context:
        'Un collègue de Nadia a préparé ce graphique avec le commentaire : « Rennes vend trois fois moins que Nantes ».',
      kind: 'bars',
      labels: ['Rennes', 'Nantes'],
      series: [
        {
          label: 'CA HT 2025',
          values: [
            HISTOIRES_B3_01['ca-2025-rennes'],
            HISTOIRES_B3_01['ca-2025-nantes'],
          ],
          tone: 'teal',
        },
      ],
      axisRanges: [[47500, 60000]],
      axisLabels: ['47 500 à 60 000 €'],
      unit: '€',
      source:
        'Export des ventes de Norvane Équipement, CA arrondi à la centaine d’euros (données fictives).',
      description:
        'Diagramme en barres : CA HT 2025 de Rennes et de Nantes, axe vertical de 47 500 € à 60 000 € ; barres de 51 600 € et 59 500 €.',
    },
  ),
  {
    screenId: 'B3-01-A3-02-VOTE-GRAPHIQUE',
    titre: 'Vote : que décidez-vous ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 2,
    concepts: ['choix-du-graphique'],
    notes: moteur.puces(
      'Ouvrir d’abord le classeur de reprise de l’acte 3, tous, y compris ceux qui ont tout réussi.',
      'Temps « réfléchir » du niveau 5 : vote non noté, 1 min de vote et 1 min de révélation.',
      'Révélation : redessiner au tableau les deux barres depuis zéro.',
    ),
    proprietes: {
      modalite: 'solo',
      pieceJointe: {
        libelle: 'Classeur de reprise de l’acte 3',
        fichier: CLASSEURS_B3_01.repriseActe3,
      },
      questions: [
        moteur.vote(
          'b3-01-a3-graphique',
          'choix-du-graphique',
          false,
          'D’après le graphique de l’écran précédent, Rennes a-t-elle vendu trois fois moins que Nantes en 2025 ?',
          'Non : l’axe est tronqué',
          [
            ['Oui', 'axe-tronque-lu-comme-ecart'],
            ['Impossible à dire', 'axe-tronque-lu-comme-ecart'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Un axe tronqué grossit l’écart',
        lignes: [
          'L’axe part de 47 500 € : les barres ne montrent que ce qui dépasse ce seuil.',
          'Rennes a vendu 51 600 €, Nantes 59 500 € : environ 13 % de moins, pas trois fois moins.',
          'Depuis zéro, les deux barres ont presque la même hauteur. Un axe tronqué se signale, ou ne se montre pas à un comité.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A3-03-COURS-GRAPHIQUES',
      titre: 'Cours : un graphique répond à une question',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['choix-du-graphique'],
      notes: moteur.puces(
        '3 min ; faire dire la question avant le type de graphique, à chaque ligne.',
        'Montrer qu’un titre qui conclut se lit en deux secondes, un titre « CA par agence » non.',
        'Transition : « À chaque question son graphique : exercice 8. »',
      ),
    },
    'lesson',
    {
      title: 'Un graphique répond à une question',
      subtitle: 'Trace écrite · niveau 5',
      blocks: [
        {
          kind: 'method',
          title: 'D’abord la question, ensuite le graphique',
          text: 'Chaque question de la direction a son graphique.',
          steps: [
            'Comparer des agences ou des produits : barres.',
            'Suivre une évolution dans le temps : courbe.',
            'Montrer la composition d’un total, en peu de parts : barres empilées.',
            'Voir comment se répartissent des valeurs : histogramme, sous Insertion › Graphique statistique ; l’« histogramme groupé » d’Excel, lui, fait des barres.',
            'Chercher un lien entre deux mesures : nuage de points.',
            'Suivre un indicateur clé : la valeur, avec son objectif ou l’an passé.',
          ],
        },
        {
          kind: 'property',
          title: 'À éviter',
          text: 'La 3D, qui déforme les hauteurs ; le camembert de plus de cinq parts, illisible ; l’axe tronqué non signalé, qui grossit les écarts ; le double axe, qui fabrique des croisements.',
        },
        {
          kind: 'example',
          title: 'Un titre qui dit la conclusion',
          text: '« Caen à 87 % de son objectif », un exemple hors dossier, plutôt que « CA et objectif par agence » : le lecteur sait quoi regarder avant même de lire les barres.',
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A3-04-TRI-GRAPHIQUES',
      titre: 'Exercice 8 — À chaque question son graphique',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 3,
      concepts: ['choix-du-graphique'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 2 min',
        'Réflexion : faire dire, pour chaque question, si elle compare, suit le temps, décompose, répartit ou relie.',
        'Pièges : une évolution rangée en barres ; un histogramme confondu avec des barres ; un graphique choisi avant la question.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-01-a3-graphiques',
            intitule:
              'Associez chaque question de la direction au graphique qui y répond.',
          },
          'choix-du-graphique',
          [
            ['barres', 'Barres'],
            ['courbe', 'Courbe'],
            ['empile', 'Barres empilées'],
            ['histogramme', 'Histogramme (répartition par tranches)'],
            ['nuage', 'Nuage de points'],
            ['kpi', 'Indicateur et son contexte'],
          ],
          [
            {
              id: 'agence-qui-vend-le-plus',
              libelle: 'Quelle agence vend le plus ?',
              categorie: 'barres',
              confusion: 'graphique-sans-question',
              justification: 'on compare des agences entre elles',
            },
            {
              id: 'ca-mois-par-mois',
              libelle: 'Comment évolue le CA, mois par mois ?',
              categorie: 'courbe',
              confusion: 'graphique-sans-question',
              justification: 'on suit une mesure dans le temps',
            },
            {
              id: 'composition-rennes',
              libelle: 'De quoi est fait le CA de Rennes ?',
              categorie: 'empile',
              confusion: 'graphique-sans-question',
              justification: 'on décompose un total en quatre catégories',
            },
            {
              id: 'repartition-delais',
              libelle: 'Comment se répartissent les délais de livraison ?',
              categorie: 'histogramme',
              confusion: 'graphique-sans-question',
              justification: 'on regarde la distribution d’une mesure',
            },
            {
              id: 'remise-et-marge',
              libelle: 'La remise fait-elle baisser la marge ?',
              categorie: 'nuage',
              confusion: 'graphique-sans-question',
              justification: 'on cherche un lien entre deux mesures',
            },
            {
              id: 'cumul-face-objectif',
              libelle: 'Où en est le CA cumulé face à l’objectif ?',
              categorie: 'kpi',
              confusion: 'graphique-sans-question',
              justification: 'un chiffre clé, lu avec son objectif',
            },
          ],
        ),
      },
    },
    {
      minutes: 1,
      notes: [
        'Corriger en partant de la carte la plus ratée (taux d’erreur au pupitre).',
        'Transition : « Le graphique de la direction : exercice 9. »',
      ],
    },
    [
      [
        'barres',
        'Comparer des agences : des barres, triées de la plus forte à la plus faible.',
      ],
      [
        'courbe',
        'Suivre le CA mois par mois : une courbe, qui relie les mois dans l’ordre. Des barres comparent, elles ne montrent pas une tendance.',
      ],
      [
        'empile',
        'Décomposer le CA de Rennes en quatre catégories : des barres empilées.',
      ],
      [
        'histogramme',
        'Répartir les délais de livraison : un histogramme, par tranches de jours.',
      ],
      [
        'nuage',
        'Relier la remise et la marge : un nuage de points, une ligne par point.',
      ],
      [
        'kpi',
        'Le CA cumulé face à l’objectif : un indicateur, avec son objectif à côté.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A3-05-ATELIER-GRAPHIQUES',
      titre: 'Exercice 9 — CA et objectif par agence',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 7,
      concepts: ['choix-du-graphique', 'tableau-de-bord'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 6 min',
        'Réflexion : faire dire où vit l’objectif : dans une autre table que les ventes, d’où SOMME.SI.ENS et pas un TCD seul.',
        'Piège : comparer neuf mois de ventes à l’objectif de toute la table.',
      ),
      proprietes: {
        intitule: 'Exercice 9 — CA et objectif par agence',
        consigne:
          'Essentiel, dans le classeur de reprise de l’acte 3 : une synthèse par agence, de janvier à septembre 2026 : le CA cumulé par SOMME.SI.ENS sur T_Commandes, l’objectif cumulé par SOMME.SI.ENS sur Objectifs, le taux d’atteinte. Puis un graphique en barres groupées CA et objectif, avec un titre qui conclut, une légende et un axe depuis zéro. Sous Windows (Excel 2019, 2021 ou 365), vous pouvez aussi mettre Agences et Objectifs sous forme de tableau, nommés T_Agences et T_Objectifs, puis relier T_Commandes et T_Objectifs à T_Agences par agence_id dans Données › Relations ; dans le TCD, créé avec « Ajouter ces données au modèle de données », agence_id de T_Agences en lignes, ca_ht de T_Commandes et objectif_ca_ht de T_Objectifs en valeurs, et deux filtres, car un filtre ne passe pas d’une table à l’autre : annee de T_Commandes sur 2026, mois de T_Objectifs de janvier à septembre 2026. Sur Mac, le modèle de données n’existe pas : la synthèse par SOMME.SI.ENS suffit. Défi : les courbes du CA mensuel 2025 et 2026, superposées.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a3-agences-sous-objectif',
            'tableau-de-bord',
            'Combien d’agences ont un CA de janvier à septembre 2026 sous leur objectif cumulé de la même période ?',
            'agences',
            ['objectif-annuel-pour-cumul'],
          ),
          questionChiffree(
            'b3-01-a3-atteinte-rennes',
            'tableau-de-bord',
            'Quel est le taux d’atteinte de Rennes (AG06), de janvier à septembre 2026 ?',
            '%',
            ['objectif-annuel-pour-cumul'],
          ),
        ],
      },
    },
    {
      minutes: 1,
      notes: [
        'Corriger les deux questions ; projeter un graphique réussi, titre compris.',
        'Défi : un TCD mois en lignes, années en colonnes, puis un graphique en courbes.',
        'Transition : « Nadia a trente secondes : un vote. »',
      ],
    },
    [
      [
        'b3-01-a3-agences-sous-objectif',
        'Trois agences restent sous leur objectif cumulé de janvier à septembre 2026.',
      ],
      [
        'b3-01-a3-atteinte-rennes',
        'CA de Rennes ÷ objectif cumulé de Rennes, qui additionne ses objectifs mensuels de janvier à septembre 2026 : 79,0 %, le taux le plus bas du réseau. Comparé à tous les objectifs de la table, vingt et un mois, le CA de neuf mois paraît sous l’objectif dans les 12 agences, et Rennes tombe à 33,8 %.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A3-06-VOTE-TRENTE-SECONDES',
    titre: 'Vote : trente secondes',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 3,
    concepts: ['tableau-de-bord'],
    notes: moteur.puces(
      'Temps « réfléchir » du niveau 6 : vote non noté, 2 min de vote et 1 min de révélation.',
      'Faire dire ce que Nadia fera de chaque option devant le comité.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a3-trente-secondes',
          'tableau-de-bord',
          false,
          'Nadia a trente secondes avant le comité. Que doit-elle voir d’abord ?',
          'Quatre chiffres, chacun avec sa comparaison',
          [
            ['Le tableau de toutes les lignes', 'detail-au-lieu-de-synthese'],
            ['Dix graphiques', 'graphique-sans-question'],
            ['Quatre chiffres, sans comparaison', 'kpi-sans-contexte'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Quatre chiffres en contexte, le détail sur demande',
        lignes: [
          'En trente secondes, on lit quatre chiffres, pas quatre mille lignes ni dix graphiques.',
          'Chaque chiffre porte sa comparaison : l’objectif, ou la même période de l’an passé. Seul, un chiffre ne dit ni bien ni mal.',
          'Le détail vient ensuite, sur demande : graphiques, TCD et segments.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A3-07-COURS-DASHBOARD',
      titre: 'Cours : l’anatomie d’un tableau de bord',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['tableau-de-bord'],
      notes: moteur.puces(
        '3 min ; faire dire la question de décision du tableau de bord de Nadia.',
        'Lire l’exemple de Caen, pris hors dossier, en trois temps : constat, cause, action.',
        'Transition : « Voyons la mise en forme conditionnelle et les segments. »',
      ),
    },
    'lesson',
    {
      title: 'L’anatomie d’un tableau de bord',
      subtitle: 'Trace écrite · niveau 6',
      blocks: [
        {
          kind: 'definition',
          title: 'Un tableau de bord répond à une question de décision',
          text: 'Pas « toutes les ventes », mais « où le réseau décroche-t-il, et pourquoi ? ». Ce qui n’aide pas à répondre n’y figure pas.',
        },
        {
          kind: 'property',
          title: 'Ce qu’il contient',
          text: 'Une page, lisible en trente secondes.',
          steps: [
            'Quatre indicateurs clés, chacun avec son contexte : l’objectif cumulé sur les mêmes mois, ou la même période de l’an passé.',
            'Deux graphiques, chacun avec un titre qui conclut.',
            'Des segments : un clic filtre tous les TCD connectés et leurs graphiques.',
            'Les anomalies signalées par mise en forme conditionnelle.',
          ],
        },
        {
          kind: 'method',
          title: 'Une recommandation : constat chiffré, cause, action',
          text: 'Le constat se lit dans le tableau de bord ; la cause se cherche dans le détail ; l’action est précise, datée, et confiée à quelqu’un.',
        },
        {
          kind: 'example',
          title: 'Caen, un exemple hors dossier',
          text: 'Constat : panier moyen en baisse de 12 % sur un an, quand il progresse ailleurs. Cause : ses deux plus gros clients commandent désormais en ligne. Action : leur proposer un contrat-cadre avant la fin du trimestre, confié au directeur d’agence.',
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-01-A3-08-EXEMPLE-MFC-SEGMENTS',
      titre: 'Exemple guidé : MFC et segments connectés',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 2,
      concepts: ['tableau-de-bord'],
      notes: moteur.puces(
        'Exemple lu, pas refait : chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Montrer chaque geste au pupitre dans Excel ; les étudiants les reprennent à l’exercice 10.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-01-a3-exemple-mfc',
          enonce:
            'Une feuille de synthèse : une agence par ligne à partir de la ligne 5, le taux d’atteinte en colonne E ; à côté, deux TCD, le CA par mois et la marge par agence. Faites ressortir les agences sous 95 % de leur objectif, puis reliez un segment aux deux TCD.',
          etapes: [
            {
              id: 'mfc',
              intitule: 'La règle de couleur',
              raisonnement:
                'Accueil › Mise en forme conditionnelle › Nouvelle règle › Utiliser une formule : =$E5<0,95, remplissage rouge. Le $ fige la colonne E : toute la ligne de l’agence se colore.',
              invite:
                'Quelle formule colore les agences sous 95 % de leur objectif ?',
            },
            {
              id: 'barres',
              intitule: 'Les barres de données',
              raisonnement:
                'Sur la colonne du CA : Mise en forme conditionnelle › Barres de données. La longueur de la barre se lit avant le nombre.',
              invite: 'Comment rendre le CA lisible d’un coup d’œil ?',
            },
            {
              id: 'segment',
              intitule: 'Le segment connecté',
              raisonnement:
                'Clic dans un TCD › Insertion › Segment › region ; puis clic droit sur le segment › Connexions de rapport : cocher les deux TCD. Un clic filtre les deux.',
              invite: 'Comment un seul segment filtre-t-il deux TCD ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'Montrer la règle appliquée à toute la plage, de A5 à la dernière agence.',
        'Transition : « Le tableau de bord Direction : exercice 10. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A3-09-ATELIER-DASHBOARD',
      titre: 'Exercice 10 — Le tableau de bord Direction',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['tableau-de-bord', 'indicateur-statistique'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 12 min',
        'Réflexion : faire dire les quatre indicateurs et la comparaison de chacun avant de construire.',
        'Annoncer le palier défi aux plus rapides : il se corrige oralement, sans note.',
        'Pièges : neuf mois comparés à douze ; toute la table au lieu de 2026 ; moyenne des taux ; marge divisée par le coût d’achat ; ligne d’en-tête comptée parmi les lignes.',
      ),
      proprietes: {
        intitule: 'Exercice 10 — Le tableau de bord Direction',
        consigne:
          'Essentiel, dans un onglet Dashboard : quatre indicateurs (CA cumulé 2026, évolution par rapport à la même période de 2025, taux de marque, lignes en quarantaine), le graphique de l’exercice 9, un TCD de la marge par agence avec une mise en forme conditionnelle, et deux segments connectés à ce TCD, region et categorie. Défi : une mise en page A4 paysage, prête à imprimer.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a3-evolution',
            'tableau-de-bord',
            'De combien le CA de janvier à septembre 2026 a-t-il évolué par rapport à la même période de 2025 ?',
            '%',
            ['evolution-sur-annee-pleine'],
          ),
          questionChiffree(
            'b3-01-a3-ca-2026',
            'tableau-de-bord',
            'Quel est le CA HT cumulé du réseau, de janvier à septembre 2026 ?',
            '€',
            ['periode-mal-delimitee'],
          ),
          questionChiffree(
            'b3-01-a3-marge-marseille',
            'indicateur-statistique',
            'Quel est le taux de marque de Marseille (AG09), marge ÷ CA HT, de janvier à septembre 2026 ?',
            '%',
            [
              'moyenne-simple-des-taux',
              'marque-confondue-avec-marge',
              'periode-mal-delimitee',
            ],
          ),
          questionChiffree(
            'b3-01-a3-quarantaine',
            'qualite-des-donnees',
            'Combien de lignes de données, hors en-tête, compte l’onglet Quarantaine du classeur de reprise ?',
            'lignes',
            ['en-tete-compte-comme-ligne'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, dans l’ordre où les explications se dévoilent ; s’attarder sur la moins réussie (score sous chaque correction).',
        'Projeter un tableau de bord réussi : quatre indicateurs, chacun avec sa comparaison.',
        'Transition : « Ce tableau de bord raconte quatre histoires : vos recommandations. »',
      ],
    },
    [
      [
        'b3-01-a3-evolution',
        'CA de janvier à septembre 2026 ÷ CA de janvier à septembre 2025 − 1 : +8,6 %. Rapporté à toute l’année 2025, douze mois contre neuf, il donnerait −22,1 % : une chute qui n’existe pas.',
      ],
      [
        'b3-01-a3-ca-2026',
        'SOMME.SI.ENS sur ca_ht, date_commande de janvier à septembre 2026 : 575 046 €.',
      ],
      [
        'b3-01-a3-marge-marseille',
        'Marge de Marseille ÷ CA HT de Marseille, de janvier à septembre 2026 : un taux de marque de 26,9 %. Toute la table, 2025 compris, mêle deux années : 1 313 125 € de CA à la deuxième question, 29,8 % de taux de marque ici. La moyenne des taux de chaque ligne donne 28,7 % : les petites lignes y pèsent autant que les grosses. Divisée par le coût d’achat, la même marge donne 36,9 % : c’est le taux de marge, un autre indicateur.',
      ],
      [
        'b3-01-a3-quarantaine',
        'L’onglet Quarantaine compte 60 lignes de données, chacune avec son motif : les 85 lignes « À vérifier » de l’exercice 4, moins les 40 dates ISO que DATEVAL convertit sans ambiguïté, plus 9 produits inconnus et 6 prix hors norme. NBVAL sur toute la colonne A compte aussi l’en-tête : 61.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A3-10-RECOMMANDATIONS',
      titre: 'Vos trois recommandations au comité',
      diffusion: 'seance',
      brique: 'fp-pro',
      dureeMinutes: 7,
      concepts: ['tableau-de-bord'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 6 min',
        'Réflexion : faire relire le tableau de bord en cherchant ce qui sort de l’ordinaire : une agence, une catégorie, un délai.',
        'Rouen (91,9 %) : troisième agence sous l’objectif, en recul d’environ 2 % sur un an, de −3 % à 0 % selon la catégorie, sans cause qui ressorte du détail. À surveiller, pas une histoire : un constat sans cause ne fait pas une recommandation.',
      ),
      proprietes: {
        metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
        situation:
          'Jeudi, Nadia Ferrand présente le réseau au comité de direction. Elle vous demande trois recommandations, tirées de votre tableau de bord.',
        geste:
          'Pour chacune : un constat chiffré, sa cause trouvée dans le détail, une action précise, datée, confiée à quelqu’un.',
        consequence:
          'Une recommandation sans chiffre ne convainc pas ; sans cause, elle traite le symptôme ; sans action, elle ne change rien.',
        questionsLibres: [
          {
            id: 'b3-01-a3-recommandations:recommandation-1',
            question: 'Recommandation 1 : constat chiffré → cause → action.',
            placeholder: 'Constat : … Cause : … Action : …',
          },
          {
            id: 'b3-01-a3-recommandations:recommandation-2',
            question: 'Recommandation 2 : constat chiffré → cause → action.',
            placeholder: 'Constat : … Cause : … Action : …',
          },
          {
            id: 'b3-01-a3-recommandations:recommandation-3',
            question: 'Recommandation 3 : constat chiffré → cause → action.',
            placeholder: 'Constat : … Cause : … Action : …',
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Révéler la correction : les quatre histoires s’affichent ensemble. Les commenter une à une, en demandant à main levée qui l’avait trouvée avant de passer à la suivante.',
        'Transition : « Gardez la fiche mémo, puis complétez votre cahier de règles. »',
      ],
    },
    [
      [
        'marseille',
        'Marseille : la marge fond. Taux de marque de 32,3 % de janvier à septembre 2025, 26,9 % sur la même période de 2026, alors que le CA dépasse l’objectif. Cause : depuis janvier, le commercial C26 accorde des remises de 18 à 30 %, quand le réseau reste entre 0 et 10 %. Action : dès octobre, toute remise au-delà de 10 % validée par la direction, contrôle confié au responsable de l’agence.',
      ],
      [
        'rennes',
        'Rennes : sous l’objectif. Taux d’atteinte de 79,0 %, le plus bas du réseau. Cause : l’informatique recule de 40,2 % par rapport à la même période de 2025, les autres catégories bougent peu, de −4 % à +2 %. Action : d’ici décembre, reprendre la perte en informatique client par client et relancer l’offre, plan confié au responsable de l’agence.',
      ],
      [
        'lille',
        'Lille : la croissance. CA de janvier à septembre 2026 en hausse de 23,1 % sur la même période de 2025, la plus forte évolution du réseau. Cause : toute la demande de l’agence progresse, chacune des catégories croît de plus de 10 %, pas une seule. Action : avant le prochain comité, décrire ce qui marche à Lille et le partager aux autres agences, travail confié au responsable de l’agence.',
      ],
      [
        'strasbourg',
        'Strasbourg : les retards. Délai médian de 8 jours ouvrés en 2026, contre 2 en 2025, et des ruptures livrées environ deux mois plus tard. Le contrat promet 5 jours ouvrés. Cause : le décrochage date de mars 2026 et touche toutes les catégories, signe d’un problème de transport à l’agence, aggravé par des ruptures de stock d’avril à juillet. Action : dès octobre, traiter le transport et le stock de Strasbourg avant de perdre ses clients, plan confié au responsable de l’agence.',
      ],
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-01-A3-11-FICHE-MEMO',
      titre: 'Fiche mémo : de la donnée brute à la décision',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: [
        'jeu-de-donnees',
        'nettoyage',
        'agregation-conditionnelle',
        'tableau-croise-dynamique',
        'choix-du-graphique',
        'tableau-de-bord',
      ],
      notes: moteur.puces(
        '3 min de lecture ; la fiche s’imprime et se garde pour la séance 2.',
        'Faire relier chaque case à la règle écrite dans le cahier.',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : de la donnée brute à la décision',
      subtitle:
        'Six niveaux : pour chacun, la question à se poser, les outils et le piège principal.',
      imprimable: true,
      items: [
        {
          title: 'Comprendre',
          description:
            'Une ligne, c’est quoi, et quelle clé relie les tables ? Granularité, types, clés. Piège : relier par un nom ou une ville.',
        },
        {
          title: 'Nettoyer',
          description:
            'Faux ou suspect ? Automatique ou humain ? SUPPRESPACE, NOMPROPRE, CNUM, colonne de contrôle, quarantaine. Piège : supprimer au lieu de signaler.',
        },
        {
          title: 'Transformer',
          description:
            'Quelle famille de problème ? INDEX et EQUIV, SOMME.SI.ENS, NB.JOURS.OUVRES, MEDIANE. Piège : un critère mal écrit ou une période mal délimitée.',
        },
        {
          title: 'Modéliser',
          description:
            'Le calcul tiendra-t-il au prochain export ? Tableau structuré, TCD, regroupement par années, segments. Piège : la plage fixe.',
        },
        {
          title: 'Visualiser',
          description:
            'Quelle question le graphique doit-il trancher ? Barres, courbe, empilé, histogramme, nuage, indicateur. Piège : l’axe tronqué non signalé.',
        },
        {
          title: 'Décider',
          description:
            'Que doit voir le comité en trente secondes ? Quatre indicateurs en contexte, constat, cause, action. Piège : un chiffre sans comparaison.',
        },
      ],
    },
  ),
  {
    screenId: 'B3-01-A3-12-CAHIER-DE-REGLES',
    titre: 'Cahier de règles : niveaux 5 et 6, puis relecture',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 5,
    concepts: ['choix-du-graphique', 'tableau-de-bord'],
    notes: moteur.puces(
      '4 min d’écriture individuelle, puis 1 min pour lire deux réponses à la troisième question.',
      'Règles modèles, à montrer après la saisie : « Je pose la question avant de choisir le graphique » ; « Je recommande par un constat chiffré, sa cause et une action. »',
      'Annoncer la séance 2 : l’agent Data Analyst appliquera ces six règles au prochain export de Nadia.',
    ),
    proprietes: {
      metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Votre cahier compte quatre règles. Vous écrivez les deux dernières, puis vous choisissez celle que l’agent de la séance 2 recevra en premier.',
      geste:
        'Écrivez une règle par niveau, puis justifiez votre choix en une phrase.',
      consequence:
        'L’agent n’a que vos règles : celle qui manque, il ne l’appliquera pas.',
      questionsLibres: [
        {
          id: 'b3-01-a3-regles:regle-visualiser',
          question:
            'Niveau 5 · Visualiser : votre règle avant de choisir un graphique.',
          placeholder: 'Avant le graphique, je…',
        },
        {
          id: 'b3-01-a3-regles:regle-decider',
          question:
            'Niveau 6 · Décider : votre règle pour écrire une recommandation.',
          placeholder: 'Je recommande…',
        },
        {
          id: 'b3-01-a3-regles:regle-la-plus-utile',
          question:
            'Laquelle de vos six règles confieriez-vous en premier à un agent, et pourquoi ?',
          placeholder: 'Ma règle n° … parce que…',
        },
      ],
    },
  },
  {
    screenId: 'B3-01-A3-13-BILLET-DE-SORTIE',
    titre: 'Billet de sortie',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 5,
    concepts: ['qualite-des-donnees'],
    notes: moteur.puces(
      '5 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : échanger les deux dates ; supprimer la ligne.',
      'Lire les réponses libres avant la séance 2 : ce qui reste flou ouvre la séance.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a3-billet',
          'qualite-des-donnees',
          true,
          'Une ligne porte une date_livraison antérieure à sa date_commande. La corrige-t-on automatiquement ?',
          'Non : on la signale et on demande (faux · humain)',
          [
            [
              'Oui : on échange les deux dates',
              'suspect-corrige-sans-validation',
            ],
            [
              'Oui : on supprime la ligne',
              'suppression-au-lieu-de-signalement',
            ],
          ],
        ),
      ],
      invite:
        'En une phrase : qu’est-ce qui reste flou pour vous après cette séance ?',
    },
  },
];
