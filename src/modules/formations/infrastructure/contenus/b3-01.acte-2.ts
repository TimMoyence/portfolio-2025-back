import { CLASSEURS_B3_01 } from './b3-01.donnees';
import { questionChiffree } from './b3-01.questions';
import * as moteur from './briques';

export const ACTE_2: moteur.Acte = [
  {
    screenId: 'B3-01-A2-01-VOTE-FAMILLE',
    titre: 'Vote : quelle famille de problème ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 3,
    concepts: ['recherche-dans-une-table', 'agregation-conditionnelle'],
    notes: moteur.puces(
      'Ouvrir d’abord le classeur de reprise, tous, y compris ceux qui ont tout réussi : les résultats se compareront sur la même base.',
      'Montrer l’onglet Quarantaine : les lignes à demander, chacune avec son motif. Les dates ISO, que DATEVAL convertit sans ambiguïté, n’y sont plus ; les produits inconnus et les prix hors norme, que le contrôle de l’exercice 4 ne voyait pas, y sont.',
      'Temps « réfléchir » du niveau 3 : vote non noté, 2 min de vote et 1 min de révélation.',
      'Faire dire les deux familles dans l’ordre : on cherche la catégorie, puis on additionne.',
    ),
    proprietes: {
      modalite: 'solo',
      pieceJointe: {
        libelle: 'Classeur de reprise de l’acte 2',
        fichier: CLASSEURS_B3_01.repriseActe2,
      },
      questions: [
        moteur.vote(
          'b3-01-a2-famille',
          'agregation-conditionnelle',
          false,
          'Nadia demande « le CA de Rennes en informatique en 2026 ». De quelle famille de problème s’agit-il ?',
          'Additionner sous conditions, après avoir cherché la catégorie',
          [
            [
              'Chercher une valeur dans une table',
              'famille-de-probleme-mal-nommee',
            ],
            ['Compter les lignes de Rennes', 'famille-de-probleme-mal-nommee'],
            ['Regrouper toutes les ventes de Rennes', 'periode-mal-delimitee'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Deux familles, dans l’ordre',
        lignes: [
          'La catégorie d’un produit vit dans l’onglet Produits : on la cherche d’abord, ligne par ligne.',
          'Puis on additionne ca_ht sous trois conditions : l’agence de Rennes, la catégorie Informatique, une date en 2026.',
          'Nommer la famille avant de choisir la fonction : c’est la règle du niveau 3.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A2-02-FAMILLES',
      titre: 'Les dix familles de problèmes',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: [
        'recherche-dans-une-table',
        'agregation-conditionnelle',
        'calcul-sur-dates',
      ],
      notes: moteur.puces(
        '3 min, enchaînées sur la trace écrite : 6 min d’exposition au plus.',
        'Faire lire la colonne des questions : la direction parle en questions, pas en fonctions.',
        'La colonne des variantes est un raccourci, jamais une obligation : le cas pratique se fait sur toute version d’Excel.',
      ),
    },
    'table',
    {
      title: 'Les dix familles de problèmes',
      subtitle: 'Nommer la famille de la question avant d’écrire la formule.',
      columns: [
        { key: 'famille', label: 'Famille' },
        { key: 'question', label: 'Question de la direction' },
        { key: 'socle', label: 'Socle (Excel 2019 et +)' },
        { key: 'variante', label: 'Variante' },
      ],
      rows: [
        {
          famille: 'Chercher',
          question: 'Catégorie de ce produit ?',
          socle: 'INDEX et EQUIV',
          variante: 'RECHERCHEX',
        },
        {
          famille: 'Compter',
          question: 'Combien de fortes remises ?',
          socle: 'NB.SI.ENS',
          variante: '—',
        },
        {
          famille: 'Additionner sous conditions',
          question: 'CA de Rennes en informatique ?',
          socle: 'SOMME.SI.ENS, SOMMEPROD',
          variante: '—',
        },
        {
          famille: 'Comparer',
          question: 'Cette ligne est-elle en retard ?',
          socle: 'SI, ET, OU, SI.CONDITIONS',
          variante: '—',
        },
        {
          famille: 'Classer',
          question: 'Les meilleures agences ?',
          socle: 'RANG, GRANDE.VALEUR',
          variante: 'TRIER',
        },
        {
          famille: 'Transformer',
          question: 'Que vaut ce montant en texte ?',
          socle: 'SUPPRESPACE, CNUM, TEXTE',
          variante: 'Power Query',
        },
        {
          famille: 'Filtrer',
          question: 'Les retards de Strasbourg ?',
          socle: 'Filtre automatique',
          variante: 'FILTRE',
        },
        {
          famille: 'Regrouper',
          question: 'CA par région et trimestre ?',
          socle: 'Tableau croisé dynamique',
          variante: 'UNIQUE',
        },
        {
          famille: 'Manipuler le temps',
          question: 'Combien de jours ouvrés ?',
          socle: 'NB.JOURS.OUVRES, SERIE.JOUR.OUVRE, DATEDIF',
          variante: '—',
        },
        {
          famille: 'Détecter une anomalie',
          question: 'Quel délai sort du lot ?',
          socle: 'MFC, MEDIANE, ECARTYPE',
          variante: '—',
        },
      ],
      note: 'RECHERCHEX, TRIER, FILTRE et UNIQUE : Excel 2021 ou 365. Power Query : Windows dès Excel 2016, Mac avec 365. MFC : mise en forme conditionnelle.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-01-A2-03-COURS-CHERCHER-AGREGER',
      titre: 'Cours : chercher et additionner sous conditions',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: [
        'recherche-dans-une-table',
        'agregation-conditionnelle',
        'reference-de-cellule',
      ],
      notes: moteur.puces(
        '3 min ; faire taper la formule INDEX et EQUIV sur un poste volontaire, puis la recopier sans $ : les #N/A gagnent la colonne à mesure que les plages glissent, l’erreur fixe la règle.',
        'Insister sur le critère de date : l’opérateur entre guillemets, la date hors des guillemets, joints par &.',
        'Transition : « Reliez et additionnez : exercice 5. »',
      ),
    },
    'lesson',
    {
      title: 'Chercher dans une table, additionner sous conditions',
      subtitle: 'Trace écrite · niveau 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'method',
          title: 'Chercher : INDEX et EQUIV',
          text: 'Pour ramener la catégorie du produit de la ligne 2 : =INDEX(Produits!$C$2:$C$41;EQUIV(H2;Produits!$A$2:$A$41;0)). EQUIV trouve le rang de H2 parmi les produit_id ; INDEX lit la catégorie à ce rang. Le 0 exige une correspondance exacte.',
        },
        {
          kind: 'property',
          title: 'Additionner et compter sous conditions',
          text: 'SOMME.SI.ENS(plage_somme;plage1;critère1;plage2;critère2) additionne les lignes qui remplissent toutes les conditions ; NB.SI.ENS(plage1;critère1;plage2;critère2) les compte.',
        },
        {
          kind: 'method',
          title: 'Écrire un critère, figer une plage',
          text: 'Un critère est un texte : l’opérateur s’écrit entre guillemets.',
          steps: [
            'Un seuil de remise : ">0,15" pour plus de 15 %, jamais ">15".',
            'Une date : ">="&DATE(2026;1;1), la date hors des guillemets, jointe par &.',
            'Une plage de référentiel recopiée vers le bas se fige par des $ : Agences!$A$2:$C$13 ne glisse pas.',
          ],
        },
        {
          kind: 'example',
          title: 'Si vous avez Excel 2021 ou 365 : RECHERCHEX',
          text: '=RECHERCHEX(H2;Produits!$A$2:$A$41;Produits!$C$2:$C$41) fait le même travail en une seule fonction.',
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A2-04-ATELIER-RECHERCHE',
      titre: 'Exercice 5 — Relier et additionner',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['recherche-dans-une-table', 'agregation-conditionnelle'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 7 min',
        'Réflexion : faire nommer la famille de chaque question avant d’écrire une formule.',
        'Pièges : critère de date tout entier entre guillemets ; 15 pour 15 % ; plage de recherche non figée ; période oubliée.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — Relier et additionner',
        consigne:
          'Essentiel, dans l’onglet Commandes du classeur de reprise : ajoutez la colonne region, cherchée dans Agences sur agence_id par INDEX et EQUIV, et la colonne categorie, cherchée dans Produits sur produit_id ; figez les plages des référentiels avant de recopier. Répondez ensuite par SOMME.SI.ENS et NB.SI.ENS. Défi : une colonne cout, la quantité multipliée par le coût unitaire du produit.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a2-ca-rennes-info',
            'agregation-conditionnelle',
            'Quel est le CA HT de Rennes (AG06) en informatique, de janvier à septembre 2026 ?',
            '€',
            ['critere-mal-ecrit', 'periode-mal-delimitee'],
          ),
          questionChiffree(
            'b3-01-a2-remises-marseille',
            'agregation-conditionnelle',
            'Combien de lignes de Marseille (AG09) portent une remise supérieure à 15 %, toutes dates confondues ?',
            'lignes',
            ['critere-mal-ecrit'],
          ),
          questionChiffree(
            'b3-01-a2-ca-ouest',
            'recherche-dans-une-table',
            'Quel est le CA HT de la région Ouest, de janvier à septembre 2026 ?',
            '€',
            ['plage-recherche-non-figee', 'periode-mal-delimitee'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, dans l’ordre où les explications se dévoilent ; s’attarder sur la moins réussie (score sous chaque correction).',
        'Défi : =I2*INDEX(Produits!$E$2:$E$41;EQUIV(H2;Produits!$A$2:$A$41;0)) donne le coût de la ligne.',
        'Transition : « Passons au temps : un vote. »',
      ],
    },
    [
      [
        'b3-01-a2-ca-rennes-info',
        'SOMME.SI.ENS sur ca_ht, avec trois critères : agence_id égal à AG06, categorie égale à Informatique, date_commande ">="&DATE(2026;1;1). Résultat : 8 342 €.',
      ],
      [
        'b3-01-a2-remises-marseille',
        'Avec le critère ">0,15" sur la remise, NB.SI.ENS compte 66 lignes de Marseille. La remise est un taux : le critère ">15" ne trouve aucune ligne.',
      ],
      [
        'b3-01-a2-ca-ouest',
        'La région Ouest réunit Nantes (AG05) et Rennes (AG06) : 77 850 € de janvier à septembre 2026. Recopiée sans $, la plage de recherche glisse d’une ligne à chaque ligne : dès la ligne 14, elle a quitté la table et plus aucune agence n’est trouvée. Avant la ligne 14, la seule ligne Ouest trouvée, la ligne 2, date de 2025 : sur 2026, le total tombe à 0 €. Le même glissement vide la colonne categorie : à la première question aussi, 0 €. Un critère de date écrit tout entier entre guillemets ne compare qu’à un texte : 0 €, ici comme à la première question. Sans critère de date, on additionne aussi 2025 : 188 908 €, et 27 862 € à la première question.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A2-05-VOTE-DELAI',
    titre: 'Vote : vendredi, lundi',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 2,
    concepts: ['calcul-sur-dates'],
    notes: moteur.puces(
      'Temps « réfléchir » de la manipulation du temps : vote non noté, 1 min de vote et 1 min de révélation.',
      'Faire dire ce que promet le contrat de Norvane : une livraison en 5 jours ouvrés.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a2-delai',
          'calcul-sur-dates',
          false,
          'Le contrat de Norvane compte les délais en jours ouvrés. Une commande passée un vendredi est livrée le lundi suivant. Quel délai compte-t-on ?',
          '1 jour ouvré',
          [
            ['3 jours ouvrés', 'jours-calendaires-pour-ouvres'],
            ['2 jours ouvrés', 'bornes-comptees-dans-le-delai'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Jours calendaires ou jours ouvrés',
        lignes: [
          'Du vendredi au lundi : 3 jours calendaires, mais un seul jour ouvré, puisque le samedi et le dimanche ne se travaillent pas.',
          'Le contrat de livraison de Norvane promet 5 jours ouvrés : le délai se mesure en jours ouvrés.',
          'NB.JOURS.OUVRES compte les deux bornes : du vendredi au lundi, il renvoie 2, d’où le − 1 pour obtenir le délai.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A2-06-COURS-TEMPS-STATS',
      titre: 'Cours : le temps et les indicateurs',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['calcul-sur-dates', 'indicateur-statistique'],
      notes: moteur.puces(
        '3 min ; montrer qu’une date affichée au format nombre devient un entier.',
        'Faire dire pourquoi la médiane résiste à une rupture de stock livrée deux mois plus tard.',
        'Transition : « Délais et marge du réseau : exercice 6. »',
      ),
    },
    'lesson',
    {
      title: 'Le temps et les indicateurs',
      subtitle: 'Trace écrite · niveau 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Une date est un nombre de jours',
          text: 'Soustraire deux dates donne des jours calendaires. Les fonctions de date comptent autrement.',
          steps: [
            'NB.JOURS.OUVRES(début;fin) compte les jours ouvrés, bornes comprises : on retire 1 pour obtenir un délai.',
            'SERIE.JOUR.OUVRE(début;n) donne la date n jours ouvrés plus tard : la date promise.',
            'JOURSEM(date;2) donne le jour de la semaine, de 1 pour lundi à 7 pour dimanche.',
            'DATEDIF(début;fin;"m") compte les mois entiers écoulés ; TEMPS(h;m;s) construit une durée.',
          ],
        },
        {
          kind: 'method',
          title: 'Moyenne ou médiane',
          text: 'Un délai long et rare, comme une rupture de stock livrée deux mois plus tard, tire la moyenne vers le haut ; la médiane, la valeur du milieu, ne bouge pas. Pour un délai typique, on lit la médiane.',
          steps: [
            'Médiane sous conditions : filtrer, puis AGREGAT(12;5;plage), qui ignore les lignes masquées.',
            'Ou MEDIANE(SI((plage1=critère1)*(plage2=critère2);valeurs)), validée par Ctrl + Maj + Entrée avant Excel 2021.',
          ],
        },
        {
          kind: 'property',
          title: 'Taux de marque : un ratio de sommes',
          text: 'Taux de marque = SOMME(marge) ÷ SOMME(CA HT), jamais la moyenne des taux de chaque ligne : une petite ligne très margée pèserait autant qu’une grosse commande. Le taux de marge, lui, divise la marge par le coût d’achat HT : écrivez toujours le dénominateur. SOMMEPROD multiplie terme à terme puis additionne : elle calcule une marge totale sans colonne intermédiaire.',
        },
        {
          kind: 'example',
          title: 'Les jours fériés',
          text: 'Ce cours ne les compte pas. NB.JOURS.OUVRES et SERIE.JOUR.OUVRE acceptent en dernier argument une plage de jours fériés à exclure.',
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A2-07-ATELIER-DELAIS-MARGE',
      titre: 'Exercice 6 — Délais et marge',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['calcul-sur-dates', 'indicateur-statistique'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 7 min',
        'Réflexion : faire dire en quelle unité le contrat compte les délais avant d’écrire la colonne.',
        'Pièges : soustraire les dates ; oublier le − 1 ; résumer par la moyenne ; prendre toute la table au lieu de 2026 ; faire la moyenne des taux de ligne ; diviser la marge par le coût d’achat.',
      ),
      proprietes: {
        intitule: 'Exercice 6 — Délais et marge',
        consigne:
          'Essentiel, dans l’onglet Commandes du classeur de reprise : ajoutez les colonnes delai, =NB.JOURS.OUVRES(B2;C2)-1, date_promise, =SERIE.JOUR.OUVRE(B2;5), cout_unitaire, cherché dans Produits par INDEX et EQUIV, et marge, ca_ht moins quantite × cout_unitaire ; puis répondez. Défi : avec JOURSEM, la part des commandes passées un vendredi ; avec DATEDIF, l’ancienneté des clients en mois.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a2-delai-strasbourg',
            'calcul-sur-dates',
            'Quel est le délai médian de livraison de Strasbourg (AG12) en 2026, en jours ouvrés ?',
            'jours ouvrés',
            [
              'jours-calendaires-pour-ouvres',
              'valeur-extreme-ignoree',
              'bornes-comptees-dans-le-delai',
            ],
          ),
          questionChiffree(
            'b3-01-a2-retards',
            'calcul-sur-dates',
            'Combien de lignes commandées en 2026 sont livrées après leur date promise, cinq jours ouvrés après la commande ?',
            'lignes',
            ['jours-calendaires-pour-ouvres', 'bornes-comptees-dans-le-delai'],
          ),
          questionChiffree(
            'b3-01-a2-taux-marge',
            'indicateur-statistique',
            'Quel est le taux de marque du réseau (marge ÷ CA HT), de janvier à septembre 2026 ?',
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
        'Corriger question par question ; sur la médiane, trier les délais de Strasbourg pour montrer les ruptures en bas de colonne.',
        'Défi : JOURSEM(B2;2)=5 repère un vendredi ; dans Clients, DATEDIF(E2;DATE(2026;9;30);"m") donne l’ancienneté en mois au 30 septembre 2026.',
        'Transition : « Et si l’export d’octobre arrive ? Un vote. »',
      ],
    },
    [
      [
        'b3-01-a2-delai-strasbourg',
        'Délai = NB.JOURS.OUVRES(date_commande;date_livraison) − 1 ; la médiane des lignes de Strasbourg commandées en 2026 vaut 8 jours ouvrés. La moyenne, tirée par les ruptures livrées deux mois plus tard, monterait à 10 jours ouvrés une fois arrondie.',
      ],
      [
        'b3-01-a2-retards',
        'Une ligne est en retard quand date_livraison dépasse SERIE.JOUR.OUVRE(date_commande;5), soit quand son delai dépasse 5 : 99 lignes commandées en 2026. Avec date_commande + 5, en jours calendaires, la promesse tombe trop tôt et 481 lignes paraissent en retard ; la médiane de Strasbourg de la première question monterait à 11 jours. Sans le − 1, la colonne delai compte aussi le jour de la commande : au critère ">5", 284 lignes, livrées le jour promis comprises, et une médiane de Strasbourg de 9 jours.',
      ],
      [
        'b3-01-a2-taux-marge',
        'Marge de la période ÷ CA HT de la période : un taux de marque de 32,0 % de janvier à septembre 2026. Sur toute la table, 2025 compris, le même rapport donne 32,3 %. La moyenne des taux de chaque ligne donne 35,4 % : une petite ligne très margée y pèse autant qu’une grosse commande. Divisée par le coût d’achat, la même marge donne 47,0 % : c’est le taux de marge, un autre indicateur.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A2-08-VOTE-NOUVELLES-LIGNES',
    titre: 'Vote : 200 lignes de plus',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 2,
    concepts: ['tableau-croise-dynamique'],
    notes: moteur.puces(
      'Temps « réfléchir » du niveau 4 : vote non noté, 1 min de vote et 1 min de révélation.',
      'Faire dire ce qui arrivera au tableau de bord quand l’export d’octobre sera collé sous celui de septembre.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a2-nouvelles-lignes',
          'tableau-croise-dynamique',
          false,
          'On colle 200 lignes d’octobre sous le tableau. Les formules écrites sur A2:A4039 les prennent-elles en compte ?',
          'Non, elles restent hors de la plage',
          [
            ['Oui', 'plage-fixe-au-lieu-de-tableau'],
            ['Seulement après recalcul', 'plage-fixe-au-lieu-de-tableau'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Une plage fixe ne grandit pas',
        lignes: [
          'A2:A4039 s’arrête à la ligne 4039 : les lignes d’octobre restent dehors, même après recalcul.',
          'Un tableau structuré s’étend tout seul : chaque formule qui le cite voit les nouvelles lignes.',
          'C’est l’objet du cours suivant.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A2-09-COURS-TCD',
      titre: 'Cours : tableau structuré et tableau croisé dynamique',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        '3 min ; faire Ctrl + T en direct et montrer le nom T_Commandes dans l’onglet Création de tableau (Tableau sur Mac).',
        'Insister sur le regroupement par années : sans lui, deux printemps se cumulent.',
        'Transition : « Construisons-en un ensemble. »',
      ),
    },
    'lesson',
    {
      title: 'Tableau structuré et tableau croisé dynamique',
      subtitle: 'Trace écrite · niveau 4',
      blocks: [
        {
          kind: 'method',
          title: 'Le tableau structuré',
          text: 'Ctrl + T (⌘ + T) transforme la plage en tableau structuré, nommé T_Commandes dans Création de tableau (Tableau sur Mac) › Nom du tableau. Il s’étend aux lignes ajoutées, recopie ses colonnes calculées et se lit : =SOMME(T_Commandes[ca_ht]).',
        },
        {
          kind: 'property',
          title: 'Le tableau croisé dynamique',
          text: 'Insertion › Tableau croisé dynamique, depuis T_Commandes : champs en lignes, colonnes, valeurs et filtres ; chaque croisement est additionné ou compté.',
        },
        {
          kind: 'method',
          title: 'Regrouper, afficher en %, filtrer',
          text: 'Trois réglages font un TCD de direction.',
          steps: [
            'Clic droit sur une date › Grouper : mois ou trimestres, et années pour ne pas mêler deux printemps.',
            'Paramètres des champs de valeurs › Afficher les valeurs › % du total de la ligne : part de chaque catégorie dans l’agence.',
            'Insertion › Segment : un bouton par catégorie filtre le TCD d’un clic ; un filtre reste actif tant qu’on ne l’a pas retiré.',
          ],
        },
        {
          kind: 'example',
          title: 'Windows seulement : le modèle de données',
          text: 'Excel 2019, 2021 ou 365 : Agences en tableau T_Agences, relié à T_Commandes par agence_id dans Données › Relations ; le TCD, créé avec « Ajouter ces données au modèle de données », prend region dans T_Agences. Sur Mac, absent : la colonne region suffit.',
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-01-A2-10-EXEMPLE-TCD',
      titre: 'Exemple guidé : le TCD agence × mois',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 2,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        'Chacun refait les étapes sur son poste ; la correction se dévoile étape par étape sur ce même écran.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-01-a2-exemple-tcd',
          enonce:
            'Dans le classeur de reprise, construisez le TCD du CA par agence et par mois de l’année 2026.',
          etapes: [
            {
              id: 'source',
              intitule: 'La source',
              raisonnement:
                'Ctrl + T sur Commandes, nommé T_Commandes ; on y ajoute la colonne calculée annee, =ANNEE([@date_commande]). Puis Insertion › Tableau croisé dynamique, sur une nouvelle feuille.',
              invite:
                'Sur quoi construire le TCD pour qu’il voie les lignes d’octobre ?',
            },
            {
              id: 'champs',
              intitule: 'Les champs',
              raisonnement:
                'agence_id en lignes ; date_commande en colonnes, groupée par mois et par années ; ca_ht en valeurs, au format monétaire.',
              invite: 'Où placer l’agence, la date et le CA ?',
            },
            {
              id: 'filtre',
              intitule: 'Le filtre',
              raisonnement:
                'annee en filtre, sur 2026 : le TCD ne montre plus que l’année en cours. Un filtre reste actif tant qu’on ne l’a pas retiré.',
              invite: 'Comment ne garder que 2026 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'Montrer le filtre annee dans l’en-tête du TCD : un filtre oublié fausse la lecture suivante.',
        'Transition : « Le TCD de la direction : exercice 7. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A2-11-ATELIER-TCD',
      titre: 'Exercice 7 — Le TCD de la direction',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 11 min',
        'Réflexion : faire dire, avant de construire, ce que chaque TCD montre en lignes, en colonnes et en valeurs.',
        'Pièges : % du total général ou de la colonne au lieu du % de la ligne ; filtre annee oublié au premier TCD ; resté actif au second, recopié du premier ou de l’exemple ; trimestres groupés sans les années.',
      ),
      proprietes: {
        intitule: 'Exercice 7 — Le TCD de la direction',
        consigne:
          'Essentiel, à partir de T_Commandes. Premier TCD : agence_id en lignes, categorie en colonnes, ca_ht en valeurs affiché en % du total de la ligne, annee en filtre sur 2026. Second TCD : region en lignes, date_commande en colonnes groupée par trimestres et par années, ca_ht en valeurs. Un segment categorie relié aux deux. Défi : regroupez les remises en tranches de 5 points.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a2-part-info-rennes',
            'tableau-croise-dynamique',
            'Quelle part de son CA Rennes (AG06) réalise-t-elle en informatique, de janvier à septembre 2026 ?',
            '%',
            [
              'pourcentage-du-mauvais-total',
              'pourcentage-du-total-de-colonne',
              'periode-mal-delimitee',
            ],
          ),
          moteur.vote(
            'b3-01-a2-meilleur-trimestre',
            'tableau-croise-dynamique',
            true,
            'Quel trimestre a réalisé le plus fort CA du réseau, du premier trimestre 2025 au troisième trimestre 2026 ?',
            'T4 2025',
            [
              ['T2 2026', 'tcd-filtre-ou-dates-mal-groupees'],
              ['T2 2025', 'tcd-filtre-ou-dates-mal-groupees'],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger les deux questions ; montrer le regroupement par années qui sépare les deux printemps.',
        'Défi : clic droit sur remise › Grouper, de 0 à 0,30 par pas de 0,05.',
        'Transition : « Avant la pause, deux règles de plus. »',
      ],
    },
    [
      [
        'b3-01-a2-part-info-rennes',
        'Avec agence_id en lignes et le % du total de la ligne, la case Rennes × Informatique vaut 27,2 % : la part de l’informatique dans le CA de Rennes. En % du total général, la même case donne 1,5 % : sa part dans le CA du réseau ; en % du total de la colonne, 3,8 % : la part de Rennes dans l’informatique du réseau.',
      ],
      [
        'b3-01-a2-meilleur-trimestre',
        'Groupé par trimestres et par années, le TCD place en tête le T4 2025 : d’octobre à décembre, la saison forte du réseau. Un filtre annee resté sur 2026 ne montre que les trimestres de 2026 et met le T2 2026 en tête ; des trimestres groupés sans les années cumulent deux printemps et font gagner le deuxième trimestre. Oublié au premier TCD, le filtre annee mêle à l’inverse 2025 et 2026 : l’informatique y pèse 33,9 % du CA de Rennes.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A2-12-REGLES-ACTE-2',
    titre: 'Cahier de règles : niveaux 3 et 4',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 4,
    concepts: ['agregation-conditionnelle', 'tableau-croise-dynamique'],
    notes: moteur.puces(
      '3 min d’écriture individuelle, puis 1 min pour lire deux règles au pupitre.',
      'Règles modèles, à montrer après la saisie : « Avant la fonction, je nomme la famille du problème » ; « Je travaille sur un tableau structuré, jamais sur une plage fixe. »',
      'Puis pause de 15 minutes ; reprise à 10 h 56 sur le classeur de reprise de l’acte 3.',
    ),
    proprietes: {
      metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Avant la pause, vous ajoutez deux règles à votre cahier d’analyste : l’agent de la séance 2 devra transformer et modéliser comme vous.',
      geste:
        'Écrivez une règle par niveau : une phrase impérative et vérifiable.',
      consequence:
        'Un agent qui choisit la fonction avant de comprendre la question calcule vite, et faux.',
      questionsLibres: [
        {
          id: 'b3-01-a2-regles:regle-transformer',
          question:
            'Niveau 3 · Transformer : votre règle avant d’écrire une formule.',
          placeholder: 'Avant la fonction, je…',
        },
        {
          id: 'b3-01-a2-regles:regle-modeliser',
          question:
            'Niveau 4 · Modéliser : votre règle pour un calcul qui dure.',
          placeholder: 'Je travaille sur…',
        },
      ],
    },
  },
];
