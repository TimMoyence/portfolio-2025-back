import { CLASSEURS_B3_01 } from '../b3-01/b3-01.donnees';
import {
  graphiqueTrompeur,
  voteDesTrenteSecondes,
} from '../b3-01/b3-01.acte-3';
import { voteDuMeilleurTrimestre } from '../b3-01/b3-01.acte-2';
import {
  MEILLEUR_TRIMESTRE_B3_02,
  questionChiffreeB302,
} from './b3-02.donnees';
import { pageDeFormules } from './b3-02.briques';
import * as moteur from '../../briques';

const REPRISE_ET_T_COMMANDES: moteur.PieceReservee = {
  libelle: 'Classeur de reprise avec T_Commandes',
  classeur: CLASSEURS_B3_01.repriseActe3,
  reprend: [
    'B3-02-A1-03-TRI-ANOMALIES',
    'B3-02-A1-08-ATELIER-NETTOYAGE',
    'B3-02-A1-13-ATELIER-RECHERCHE',
    'B3-02-A2-05-ATELIER-DELAIS',
  ],
};

const DATES_ET_STATISTIQUES: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-02-A2-01-VOTE-DELAI',
      titre: 'Vote : vendredi, lundi',
      dureeMinutes: 2,
      concepts: ['calcul-sur-dates'],
      notes: moteur.puces(
        'Temps « réfléchir » des dates : vote non noté, 1 min de vote et 1 min de révélation.',
        'Faire dire ce que promet le contrat de Norvane : une livraison en 5 jours ouvrés.',
      ),
    },
    [
      moteur.vote(
        'b3-02-a2-delai',
        'calcul-sur-dates',
        false,
        'Norvane compte ses délais de livraison en jours ouvrés. Commandé un vendredi, un colis arrive le lundi suivant : quel délai compte-t-on ?',
        '1 jour ouvré',
        [
          ['3 jours ouvrés', 'jours-calendaires-pour-ouvres'],
          ['2 jours ouvrés', 'bornes-comptees-dans-le-delai'],
        ],
      ),
    ],
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-02-FORMULES-JOURS-OUVRES',
      titre: 'Formules : NB.JOURS.OUVRES et SERIE.JOUR.OUVRE',
      concepts: ['calcul-sur-dates'],
      notes: [
        '2 min, enchaînées sur les deux pages suivantes : 6 min d’exposition au plus.',
        'Montrer qu’une date mise au format Nombre devient un entier : une date est un nombre de jours. SERIE.JOUR.OUVRE rend un nombre, à mettre au format Date.',
        'Les jours fériés, facultatifs, vont en dernier argument ; ce cours ne les compte pas. Garder NB.JOURS.OUVRES sans le − 1 compte le jour de la commande.',
      ],
    },
    {
      rang: 6,
      syntaxe:
        'NB.JOURS.OUVRES(début; fin) compte du lundi au vendredi, bornes comprises ; SERIE.JOUR.OUVRE(début; n) rend la date n jours ouvrés plus tard.',
      piege:
        'C2 − B2 compte le week-end ; on écrit NB.JOURS.OUVRES(B2; C2) − 1.',
      exemple:
        'du vendredi 6 au lundi 9 mars, un seul jour ouvré ; promis le 13.',
      correspondances: [
        ['Le 6 rouge et le 9 vert', 'les dates B2 et C2'],
        ['Samedis et dimanches grisés', 'les jours non comptés'],
        ['Les cinq sauts du 6 au 13', 'SERIE.JOUR.OUVRE, n = 5'],
      ],
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-03-FORMULES-CALENDRIER',
      titre: 'Formules : JOURSEM, DATEDIF et TEMPS',
      concepts: ['calcul-sur-dates'],
      notes: [
        '2 min ; ces trois fonctions ne servent pas à l’exercice 4, elles servent au cas pratique de fin de module.',
        'DATEDIF ne figure pas dans la liste des fonctions d’Excel : la taper en entier. Unités : "Y" années, "M" mois, "D" jours ; une date de début après la date de fin rend #NOMBRE!. TEMPS repart de zéro au-delà de 23 h : TEMPS(27;0;0) rend 3:00.',
      ],
    },
    {
      rang: 7,
      syntaxe:
        'JOURSEM(date; 2) rend 1 pour lundi ; DATEDIF(début; fin; "M") compte les mois entiers ; TEMPS(h; m; s) construit une heure.',
      piege: 'sans le 2, la semaine commence le dimanche.',
      exemple: 'du 2 janvier 2025 au 30 septembre 2026 : 20 mois.',
      correspondances: [
        ['Fiche « Lun = 1 … Dim = 7 »', 'JOURSEM avec l’argument 2'],
        ['Mois entiers entre deux dates', 'DATEDIF et l’unité "M"'],
        ['L’horloge', 'TEMPS, qui repart de zéro après 23 h'],
      ],
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-04-FORMULES-MEDIANE',
      titre: 'Formules : MOYENNE, MEDIANE et la médiane sous conditions',
      concepts: ['indicateur-statistique'],
      notes: [
        '2 min ; faire dire pourquoi une rupture livrée deux mois plus tard tire la moyenne et pas la médiane.',
        'La colonne d’aide =SI(ET(F2="AG12";B2>=DATE(2026;1;1));P2;"") ne garde que Strasbourg en 2026 ; MEDIANE ignore les "". Avec un filtre, AGREGAT(12;5;plage) : 12 pour la médiane, 5 pour ignorer les lignes masquées.',
        'Transition : « Délais et retards du réseau : exercice 4. »',
      ],
    },
    {
      rang: 8,
      syntaxe:
        'MOYENNE(plage) ; MEDIANE(plage), la valeur du milieu. Sous conditions, une colonne d’aide SI(ET(…); délai; "").',
      piege:
        'MEDIANE sous un filtre compte les lignes masquées ; AGREGAT(12; 5; plage) non.',
      exemple: '1, 2, 2, 3 et 40 jours : moyenne 9,6, médiane 2.',
      correspondances: [
        ['Le carton du milieu, entouré', 'la médiane'],
        ['Balance penchée par 40', 'la moyenne, tirée vers le haut'],
        ['Ligne masquée du filtre', 'comptée par MEDIANE'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A2-05-ATELIER-DELAIS',
      titre: 'Exercice 4 — Délais et retards',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 7,
      concepts: ['calcul-sur-dates', 'indicateur-statistique'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 6),
        'Réflexion : faire dire en quelle unité le contrat compte les délais avant d’écrire la colonne P.',
        'Pièges : soustraire les dates ; oublier le − 1 ; résumer par la moyenne ; oublier l’agence ou l’année ; MEDIANE sous un filtre.',
      ),
      proprietes: {
        intitule: 'Exercice 4 — Délais et retards',
        consigne:
          'Dans l’onglet Commandes du classeur de reprise. Étape 1 : en P1 tapez delai, en P2 =NB.JOURS.OUVRES(B2;C2)-1. Étape 2 : en Q1 date_promise, en Q2 =SERIE.JOUR.OUVRE(B2;5), au format Date. Étape 3 : en R1 aide, en R2 =SI(ET(F2="AG12"; B2>=DATE(2026; 1; 1)); P2; "") ; recopiez P2:R2 jusqu’en ligne 4039. Étape 4 : la médiane, =MEDIANE(R2:R4039). Étape 5 : les retards, =NB.SI.ENS(P2:P4039; ">5"; B2:B4039; ">="&DATE(2026; 1; 1)) : un délai de plus de 5 jours ouvrés dépasse la date promise.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a2-delai-strasbourg',
            'calcul-sur-dates',
            'Quel est le délai médian de livraison de Strasbourg (AG12) en 2026, en jours ouvrés ?',
            'jours ouvrés',
            [
              'jours-calendaires-pour-ouvres',
              'valeur-extreme-ignoree',
              'bornes-comptees-dans-le-delai',
              'periode-mal-delimitee',
              'mediane-sur-liste-trop-large',
            ],
          ),
          questionChiffreeB302(
            'b3-02-a2-retards',
            'calcul-sur-dates',
            'Combien de lignes commandées en 2026 sont livrées après leur date promise ?',
            'lignes',
            ['jours-calendaires-pour-ouvres', 'bornes-comptees-dans-le-delai'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 4 du cahier : « Pour un délai typique je prends la médiane ; pour un taux, le ratio des sommes. »',
        'Transition : « Et si l’export d’octobre arrive ? Un vote. »',
      ],
    },
    [
      [
        'b3-02-a2-delai-strasbourg',
        'La colonne d’aide ne garde que les délais de Strasbourg en 2026 : MEDIANE(R2:R4039) rend 8 jours ouvrés. La moyenne, tirée par les ruptures livrées deux mois plus tard, monte à 10 une fois arrondie. Une liste trop large déplace la médiane : sans le critère de l’agence, c’est celle du réseau ; sous un filtre, MEDIANE compte aussi les lignes masquées, là où AGREGAT(12;5;P2:P4039) ne garde que les lignes visibles.',
      ],
      [
        'b3-02-a2-retards',
        'Une ligne est en retard quand son délai dépasse 5 jours ouvrés : sa date promise est passée. NB.SI.ENS, critère ">5" sur la colonne P et la date de 2026, rend 99 lignes. En jours calendaires, C2 − B2, la promesse tombe trop tôt : 481 lignes, et une médiane de Strasbourg de 11 jours. Sans le − 1, la colonne P compte aussi le jour de la commande : 284 lignes, et une médiane de 9 jours. Toutes années confondues, la médiane de Strasbourg tombe à 4 jours.',
      ],
    ],
  ),
];

const CROISER: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-02-A2-06-VOTE-NOUVELLES-LIGNES',
      titre: 'Vote : 200 lignes de plus',
      dureeMinutes: 2,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        'Temps « réfléchir » du tableau structuré : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : coller trois lignes sous les données ; =SOMME(L2:L4039) ne bouge pas.',
      ),
    },
    [
      moteur.vote(
        'b3-02-a2-nouvelles-lignes',
        'tableau-croise-dynamique',
        false,
        'L’export d’octobre ajoute 200 lignes, collées sous les données. =SOMME(L2:L4039) les additionne-t-elle ?',
        'Non : elles sont hors de la plage',
        [
          ['Oui, dès qu’on les colle', 'plage-fixe-au-lieu-de-tableau'],
          ['Oui, après un recalcul', 'plage-fixe-au-lieu-de-tableau'],
        ],
      ),
    ],
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-07-OUTIL-TABLEAU-STRUCTURE',
      titre: 'Outil : le tableau structuré et ANNEE',
      concepts: ['tableau-croise-dynamique'],
      notes: [
        '2 min, enchaînées sur la page du TCD ; faire Ctrl + L en direct et montrer le nom dans Création de tableau (Outils de tableau › Création sous Excel 2019 ; Tableau sur Mac).',
        'Une colonne calculée s’écrit une fois, =ANNEE([@date_commande]), et se recopie seule. Une colonne sans en-tête reçoit le nom Colonne1 : nommez-la avant.',
      ],
    },
    {
      rang: 9,
      syntaxe:
        'Ctrl + L (⌘ + T sur Mac), puis le nom T_Commandes ; une colonne se lit T_Commandes[ca_ht] ; ANNEE([@date_commande]).',
      piege: 'une plage fixe L2:L4039 ne voit pas les lignes collées dessous.',
      exemple: '200 lignes d’octobre collées : le tableau s’étend seul.',
      correspondances: [
        ['Cadre rouge, plage fixe', 'aveugle aux lignes ajoutées'],
        ['Ctrl+L et le cadre bleu', 'le tableau qui s’étire'],
        ['[ca_ht], [@date_commande]', 'colonne, ligne en cours'],
      ],
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-08-OUTIL-TCD',
      titre: 'Outil : le tableau croisé dynamique',
      concepts: ['tableau-croise-dynamique'],
      notes: [
        '2 min ; montrer les quatre zones du volet des champs.',
        'Autres chemins : % du total par Paramètres des champs de valeurs (sur Mac, Paramètres de champ). Sous Windows, Données › Relations relie deux tableaux (modèle de données) ; sur Mac, une colonne cherchée par RECHERCHEV suffit.',
        'Un filtre reste actif tant qu’on ne l’a pas retiré ; sans les années, deux printemps se cumulent.',
        'Transition : « Le TCD de la direction : exercice 5. »',
      ],
    },
    {
      rang: 10,
      syntaxe:
        'Insertion › Tableau croisé dynamique, depuis T_Commandes : Lignes, Colonnes, Valeurs, Filtres.',
      piege: 'le % du total général au lieu du % de la ligne.',
      exemple: 'en % de la ligne, la ligne Rennes fait 100 %.',
      correspondances: [
        ['Zone Filtres, annee = 2026', 'ce que le TCD garde'],
        ['Lignes et Colonnes', 'agence_id × categorie'],
        ['Zone Valeurs, Somme de ca_ht', 'ce que le TCD calcule'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A2-09-ATELIER-TCD',
      titre: 'Exercice 5 — Le TCD de la direction',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 7,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 6),
        'Réflexion : faire dire ce que chaque TCD montre en lignes, en colonnes et en valeurs.',
        'Pièges : % du total général ou de la colonne ; filtre annee oublié au premier TCD ; resté actif au second ; trimestres groupés sans les années.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — Le TCD de la direction',
        consigne:
          'Dans le classeur de reprise. Étape 1 : cliquez dans Commandes, Ctrl + L (⌘ + T sur Mac), nommez le tableau T_Commandes. Étape 2 : en S1 tapez annee, en S2 =ANNEE([@date_commande]) : la colonne se remplit seule. Étape 3 : premier TCD depuis T_Commandes : agence_id en Lignes, categorie en Colonnes, ca_ht en Valeurs affiché en % du total de la ligne, annee en Filtres sur 2026. Étape 4 : second TCD, sur une autre feuille : date_commande en Lignes, groupée par Trimestres et Années, ca_ht en Valeurs, sans filtre. Étape 5 : répondez.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a2-part-info-rennes',
            'tableau-croise-dynamique',
            'Quelle part de son CA Rennes (AG06) réalise-t-elle en informatique, de janvier à septembre 2026 ?',
            '%',
            [
              'pourcentage-du-mauvais-total',
              'pourcentage-du-total-de-colonne',
              'tcd-filtre-ou-dates-mal-groupees',
            ],
          ),
          voteDuMeilleurTrimestre(
            MEILLEUR_TRIMESTRE_B3_02,
            'D’après le second TCD, quel trimestre a réalisé le plus fort CA du réseau, du premier trimestre 2025 au troisième trimestre 2026 ?',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 5 du cahier : « J’écris le dénominateur de chaque pourcentage. »',
        'Transition : « Un graphique préparé pour le comité. »',
      ],
    },
    [
      [
        'b3-02-a2-part-info-rennes',
        'agence_id en lignes, % du total de la ligne : la case Rennes × Informatique vaut 27,2 %, la part de l’informatique dans le CA de Rennes. En % du total général, la même case donne 1,5 %, sa part dans le CA du réseau ; en % du total de la colonne, 3,8 %, la part de Rennes dans l’informatique du réseau.',
      ],
      [
        MEILLEUR_TRIMESTRE_B3_02,
        'Groupé par trimestres et par années, le second TCD place en tête le T4 2025, la saison forte d’octobre à décembre. Un filtre annee resté sur 2026 ne montre que 2026 et met le T2 2026 en tête ; des trimestres groupés sans les années cumulent deux printemps et font gagner le deuxième trimestre. Oublié au premier TCD, le filtre annee mêle 2025 et 2026 : l’informatique y pèse 33,9 % du CA de Rennes.',
      ],
    ],
  ),
];

const MONTRER: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B3-02-A2-10-GRAPHIQUE-TROMPEUR',
      titre: 'Un graphique de la direction',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['choix-du-graphique'],
      notes: moteur.puces(
        'Projeter sans commentaire ; 30 secondes de lecture avant le vote.',
        'Ne pas montrer l’axe du doigt : c’est l’objet du vote.',
      ),
    },
    'chart',
    graphiqueTrompeur(),
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-02-A2-11-VOTE-GRAPHIQUE',
      titre: 'Vote : que décidez-vous ?',
      dureeMinutes: 2,
      concepts: ['choix-du-graphique'],
      notes: moteur.puces(
        'Ouvrir d’abord le classeur de reprise avec T_Commandes, tous : les exercices 6 et 7 s’y font.',
        'Temps « réfléchir » des graphiques : vote non noté ; révélation : redessiner au tableau les deux barres depuis zéro.',
      ),
    },
    [
      moteur.vote(
        'b3-02-a2-graphique',
        'choix-du-graphique',
        false,
        'Le collègue de Nadia écrit sous son graphique : « Rennes vend trois fois moins que Nantes ». A-t-il raison ?',
        'Non : l’axe ne part pas de zéro',
        [
          [
            'Oui, la barre est trois fois plus basse',
            'axe-tronque-lu-comme-ecart',
          ],
          ['On ne peut pas le dire', 'axe-tronque-lu-comme-ecart'],
        ],
      ),
    ],
    REPRISE_ET_T_COMMANDES,
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-12-OUTIL-GRAPHIQUES',
      titre: 'Outil : le graphique qui répond à une question',
      concepts: ['choix-du-graphique'],
      notes: [
        '2 min ; faire dire la question avant le type de graphique.',
        'Répartition : Insertion › Insérer un graphique statistique › Histogramme (sur Mac, icône Statistiques). À éviter : la 3D, le camembert de plus de cinq parts, le double axe. Axe : clic droit › Mise en forme de l’axe › Minimum : 0.',
        'Transition : « CA et objectif par agence : exercice 6. »',
      ],
    },
    {
      rang: 11,
      syntaxe:
        'sélectionner la synthèse, en-têtes compris, puis Insertion › Graphiques recommandés.',
      piege: 'l’axe qui ne part pas de zéro grossit les écarts.',
      exemple:
        'un titre qui conclut, « Caen à 87 % de son objectif » (hors dossier).',
      correspondances: [
        ['Les six vignettes', 'une question, un type de graphique'],
        ['L’axe coupé, barré', 'l’écart grossi'],
        ['L’axe depuis 0, coché', 'l’écart à sa vraie taille'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A2-13-ATELIER-GRAPHIQUES',
      titre: 'Exercice 6 — CA et objectif par agence',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['choix-du-graphique', 'tableau-de-bord'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : faire dire où vit l’objectif, dans une autre table que les ventes, d’où la synthèse par SOMME.SI.ENS.',
        'Pièges : comparer neuf mois de ventes à tous les objectifs ; oublier la période des deux côtés.',
      ),
      proprietes: {
        intitule: 'Exercice 6 — CA et objectif par agence',
        consigne:
          'Dans le classeur de reprise avec T_Commandes, sur une feuille Synthèse. Étape 1 : en A1 à D1, les en-têtes agence_id, ca, objectif, atteinte ; en A2 à A13, les douze agence_id, de AG01 à AG12. Étape 2 : en B2, =SOMME.SI.ENS(T_Commandes[ca_ht]; T_Commandes[agence_id]; A2; T_Commandes[annee]; 2026). Étape 3 : en C2, l’objectif des mêmes mois, =SOMME.SI.ENS(Objectifs!$C$2:$C$253; Objectifs!$A$2:$A$253; A2; Objectifs!$B$2:$B$253; ">="&DATE(2026; 1; 1)). Étape 4 : en D2, =B2/C2 au format Pourcentage ; recopiez B2:D2 jusqu’en ligne 13. Étape 5 : sélectionnez A1:C13, Insertion › Histogramme groupé ; un titre qui conclut, l’axe vertical depuis 0.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a2-agences-sous-objectif',
            'tableau-de-bord',
            'Combien d’agences ont un CA de janvier à septembre 2026 sous leur objectif cumulé des mêmes mois ?',
            'agences',
            ['objectif-annuel-pour-cumul', 'periode-mal-delimitee'],
          ),
          questionChiffreeB302(
            'b3-02-a2-atteinte-rennes',
            'tableau-de-bord',
            'Quel est le taux d’atteinte de Rennes (AG06), de janvier à septembre 2026 ?',
            '%',
            ['objectif-annuel-pour-cumul', 'periode-mal-delimitee'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Projeter un graphique réussi : titre qui conclut, légende, axe depuis zéro.',
        'Transition : « Nadia a trente secondes : un vote. »',
      ],
    },
    [
      [
        'b3-02-a2-agences-sous-objectif',
        '3 agences restent sous leur objectif cumulé de janvier à septembre 2026 : la colonne D, sous 100 %, les désigne.',
      ],
      [
        'b3-02-a2-atteinte-rennes',
        'CA de Rennes ÷ objectif cumulé de Rennes, ses objectifs mensuels de janvier à septembre 2026 : 79,0 %, le taux le plus bas du réseau. Comparé à tous les objectifs de la table, vingt et un mois, le CA de neuf mois paraît sous l’objectif dans les 12 agences, et Rennes tombe à 33,8 %. Sans critère de date, ni sur les ventes ni sur les objectifs : 7 agences sous l’objectif, et Rennes à 90,8 %.',
      ],
    ],
  ),
];

const DECIDER: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-02-A2-14-VOTE-TRENTE-SECONDES',
      titre: 'Vote : trente secondes',
      dureeMinutes: 2,
      concepts: ['tableau-de-bord'],
      notes: moteur.puces(
        'Temps « réfléchir » du tableau de bord : vote non noté, 1 min de vote et 1 min de révélation.',
        'Faire dire ce que Nadia fera de chaque option devant le comité.',
      ),
    },
    [
      voteDesTrenteSecondes(
        'b3-02-a2-trente-secondes',
        'Nadia a trente secondes avant d’entrer au comité. Que lui montrez-vous d’abord ?',
      ),
    ],
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-15-FORMULES-RATIOS',
      titre:
        'Formules : taux de marque, évolution, taux d’atteinte et SOMMEPROD',
      concepts: ['indicateur-statistique', 'tableau-de-bord'],
      notes: [
        '2 min, enchaînées sur la page du tableau de bord ; faire calculer l’exemple à main levée.',
        'SOMMEPROD(I2:I4039;J2:J4039) multiplie quantite et prix_unitaire_ht ligne à ligne, puis additionne. Marge ÷ coût d’achat, c’est le taux de marge, pas le taux de marque. Neuf mois de 2026 face à douze mois de 2025 : une chute qui n’existe pas.',
      ],
    },
    {
      rang: 12,
      syntaxe:
        'taux de marque = SOMME(marge) ÷ SOMME(CA HT) ; évolution = valeur ÷ même période de l’an passé − 1 ; atteinte = réalisé ÷ objectif ; SOMMEPROD(plage1; plage2).',
      piege: 'la moyenne des taux de chaque ligne.',
      exemple:
        '1 000 € à 30 % et 100 € à 60 % : 360 ÷ 1 100 = 32,7 %, pas 45 %.',
      correspondances: [
        ['Le calcul coché', 'somme des marges ÷ somme des CA'],
        ['Le calcul barré', 'la moyenne des taux, fausse'],
        ['Calculatrice SOMMEPROD', 'quantité × prix, puis somme'],
      ],
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A2-16-OUTIL-TABLEAU-DE-BORD',
      titre: 'Outil : tableau de bord, MFC et segments',
      concepts: ['tableau-de-bord'],
      notes: [
        '2 min ; montrer la règle =$E5<0,95 appliquée de A5 à la dernière agence ; barres de données sur les seules cellules des agences.',
        'Chemins complets : Nouvelle règle › Utiliser une formule pour déterminer pour quelles cellules le format sera appliqué (sur Mac, Style Classique d’abord) ; segment sur Mac par Analyse du tableau croisé dynamique › Segment, Connexions de rapport pour en relier plusieurs. Un segment ne filtre pas les cellules calculées par formule.',
        'Recommandation hors dossier : Caen, panier moyen −12 % ; deux gros clients passés en ligne ; un contrat-cadre avant la fin du trimestre.',
        'Transition : « Le tableau de bord Direction : exercice 7. »',
      ],
    },
    {
      rang: 13,
      syntaxe:
        'une page : quatre indicateurs comparés, deux graphiques, des segments, une MFC par formule, =$E5<0,95.',
      piege: 'un chiffre sans comparaison ne dit rien.',
      exemple: 'les agences sous 95 % de leur objectif passent en rouge.',
      correspondances: [
        ['Les quatre cartes du haut', 'indicateurs et comparaisons'],
        ['Le segment Région relié', 'un filtre pour les deux TCD'],
        ['Constat, cause, action', 'la recommandation au comité'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A2-17-ATELIER-DASHBOARD',
      titre: 'Exercice 7 — Le tableau de bord Direction',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['tableau-de-bord', 'indicateur-statistique'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 7),
        'Réflexion : faire dire chaque indicateur et sa comparaison avant de construire.',
        'Pièges : neuf mois comparés à douze ; toute la table au lieu de 2026 ; moyenne des taux ; marge divisée par le coût d’achat.',
      ),
      proprietes: {
        intitule: 'Exercice 7 — Le tableau de bord Direction',
        consigne:
          'Dans le classeur de reprise avec T_Commandes, sur un onglet Dashboard. Étape 1 : en B1, le CA 2026, =SOMME.SI.ENS(T_Commandes[ca_ht]; T_Commandes[annee]; 2026). Étape 2 : en B2, le CA de janvier à septembre 2025, =SOMME.SI.ENS(T_Commandes[ca_ht]; T_Commandes[annee]; 2025; T_Commandes[date_commande]; "<="&DATE(2025; 9; 30)) ; en B3, l’évolution, =B1/B2-1, au format Pourcentage. Étape 3 : en B4, le taux de marque de Marseille, =SOMME.SI.ENS(T_Commandes[marge]; T_Commandes[agence_id]; "AG09"; T_Commandes[annee]; 2026)/SOMME.SI.ENS(T_Commandes[ca_ht]; T_Commandes[agence_id]; "AG09"; T_Commandes[annee]; 2026), au format Pourcentage. Étape 4 : un TCD de la marge par agence, la marge en barres de données, et un segment region relié au TCD. Étape 5 : répondez.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a2-evolution',
            'tableau-de-bord',
            'De combien le CA de janvier à septembre 2026 a-t-il évolué par rapport aux mêmes mois de 2025 ?',
            '%',
            ['evolution-sur-annee-pleine'],
          ),
          questionChiffreeB302(
            'b3-02-a2-ca-2026',
            'tableau-de-bord',
            'Quel est le CA HT cumulé du réseau, de janvier à septembre 2026 ?',
            '€',
            ['periode-mal-delimitee'],
          ),
          questionChiffreeB302(
            'b3-02-a2-marge-marseille',
            'indicateur-statistique',
            'Quel est le taux de marque de Marseille (AG09), marge ÷ CA HT, de janvier à septembre 2026 ?',
            '%',
            [
              'moyenne-simple-des-taux',
              'marque-confondue-avec-marge',
              'periode-mal-delimitee',
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 6 du cahier : « Je montre la méthode de chaque chiffre et le nombre de lignes retenues. »',
        'Transition : « Toutes les formules sur une page, à garder. »',
      ],
    },
    [
      [
        'b3-02-a2-evolution',
        'CA de janvier à septembre 2026 ÷ CA de janvier à septembre 2025 − 1 : +8,6 %. Rapporté à toute l’année 2025, douze mois contre neuf, il donnerait −22,1 % : une chute qui n’existe pas.',
      ],
      [
        'b3-02-a2-ca-2026',
        'SOMME.SI.ENS sur T_Commandes[ca_ht], annee égale à 2026 : 575 046 €, de janvier à septembre.',
      ],
      [
        'b3-02-a2-marge-marseille',
        'Marge de Marseille ÷ CA HT de Marseille, en 2026 : un taux de marque de 26,9 %. Toute la table, 2025 compris, mêle deux années : 1 313 125 € de CA à la question précédente, 29,8 % ici. La moyenne des taux de chaque ligne donne 28,7 % : les petites lignes y pèsent autant que les grosses. Divisée par le coût d’achat, la même marge donne 36,9 % : c’est le taux de marge.',
      ],
    ],
  ),
  ficheRecap(
    {
      screenId: 'B3-02-A2-18-FICHE-RECAP-1',
      titre: 'Fiche récap 1 : nettoyer, chercher, additionner',
      concepts: ['nettoyage', 'recherche-dans-une-table'],
    },
    [
      {
        title: 'Texte',
        description:
          'SUPPRESPACE(texte), NOMPROPRE(texte), MAJUSCULE, MINUSCULE ; NBCAR(texte) compte les caractères. Piège : écrire dans la colonne brute.',
      },
      {
        title: 'Nombre et date en texte',
        description:
          'SUBSTITUE(texte; ancien; nouveau), puis CNUM(texte) ; ESTNUM(valeur) ; DATEVAL(texte) ; UNICAR(160). Power Query rejoue le nettoyage. Piège : CNUM d’abord, #VALEUR!.',
      },
      {
        title: 'Doublons',
        description:
          'Données › Supprimer les doublons, toutes les colonnes cochées, sur une copie. Piège : la dernière ligne compte l’en-tête.',
      },
      {
        title: 'Comparer et signaler',
        description:
          'SI(test; si_vrai; si_faux), OU(…), ET(…), SI.CONDITIONS(test1; valeur1; …). Piège : ET au lieu de OU.',
      },
      {
        title: 'Chercher',
        description:
          'RECHERCHEV(clé; table; n°_colonne; FAUX), table figée par $ ; INDEX(colonne; EQUIV(clé; colonne_clé; 0)) ; RECHERCHEX, 2021 ou 365. Piège : #N/A à la recopie.',
      },
      {
        title: 'Additionner, compter',
        description:
          'SOMME.SI.ENS(plage_somme; plage1; critère1; …), NB.SI.ENS(plage1; critère1; …), critère ">="&DATE(2026; 1; 1). Piège : DATE dans les guillemets rend 0.',
      },
    ],
  ),
  ficheRecap(
    {
      screenId: 'B3-02-A2-19-FICHE-RECAP-2',
      titre: 'Fiche récap 2 : dater, résumer, croiser, montrer',
      concepts: ['calcul-sur-dates', 'tableau-de-bord'],
    },
    [
      {
        title: 'Dates',
        description:
          'NB.JOURS.OUVRES(début;fin) − 1 ; SERIE.JOUR.OUVRE(début;n) ; JOURSEM(date;2) ; DATEDIF(début;fin;"M") ; TEMPS(h;m;s) ; ANNEE(date). Piège : C2 − B2 compte le week-end.',
      },
      {
        title: 'Résumer',
        description:
          'MOYENNE, MEDIANE, AGREGAT(12;5;plage) sous filtre, ECARTYPE.STANDARD(plage). Piège : la moyenne tirée par une valeur extrême.',
      },
      {
        title: 'Classer, filtrer',
        description:
          'EQUATION.RANG(valeur;plage), GRANDE.VALEUR(plage;k), filtre automatique ; TRIER, FILTRE, UNIQUE, 2021 ou 365. Piège : un filtre resté actif.',
      },
      {
        title: 'Croiser',
        description:
          'Tableau structuré, Ctrl + L, T_Commandes[ca_ht] ; tableau croisé dynamique, % du total de la ligne, trimestres et années. Piège : la plage fixe.',
      },
      {
        title: 'Ratios',
        description:
          'Taux de marque = marge ÷ CA HT ; évolution = valeur ÷ an passé − 1 ; atteinte = réalisé ÷ objectif ; SOMMEPROD(plage1;plage2). Piège : la moyenne des taux.',
      },
      {
        title: 'Montrer',
        description:
          'Le graphique d’après la question, axe depuis zéro ; barres de données, MFC par formule, segments ; $ fige à la recopie, F4. Piège : un chiffre sans comparaison.',
      },
    ],
  ),
];

function ficheRecap(
  {
    screenId,
    titre,
    concepts,
  }: Pick<moteur.SocleDEcran, 'screenId' | 'titre' | 'concepts'>,
  items: readonly { readonly title: string; readonly description: string }[],
): moteur.EcranDeRecit {
  return moteur.ecranV2(
    {
      screenId,
      titre,
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts,
      notes: moteur.puces(
        '1 min : la fiche s’imprime et se garde pour le cas pratique de fin de module.',
        'Une carte par famille de problème : nommer la famille d’abord, la formule ensuite.',
      ),
    },
    'grid',
    {
      title: titre,
      subtitle:
        'Une carte par famille : chaque formule, sa syntaxe, son piège. « 2021 ou 365 » : Excel 2021 ou 365 seulement.',
      imprimable: true,
      items,
    },
  );
}

export const ACTE_2: moteur.Acte = [
  ...DATES_ET_STATISTIQUES,
  ...CROISER,
  ...MONTRER,
  ...DECIDER,
];
