import { CLASSEURS_B3_01 } from './b3-01.donnees';
import { questionChiffree } from './b3-01.questions';
import * as moteur from './briques';

export const ACTE_1: moteur.Acte = [
  {
    screenId: 'B3-01-A1-01-RAPPEL-RECOPIE',
    titre: 'Rappel : recopier une formule',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['reference-de-cellule'],
    notes: moteur.puces(
      'Pendant que les postes rejoignent la séance : vérifier au pupitre que tous sont connectés.',
      'Annoncer « seule la participation compte ». Réponse de mémoire, sans ouvrir Excel.',
      'Diagnostic : sous 70 % de bonnes réponses, reprendre le $ au tableau avant l’exercice 5, où les plages se figent.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a1-rappel-recopie',
          'reference-de-cellule',
          true,
          'En D2, la formule =C2*$H$1 multiplie un montant par le taux rangé en H1. On la recopie en D3. Que contient D3 ?',
          '=C3*$H$1',
          [
            ['=C3*$H$2', 'reference-absolue-ignoree'],
            ['=C2*$H$1', 'reference-absolue-ignoree'],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-02-COURRIEL',
      titre: 'Expert Data : de la donnée brute à la décision',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['jeu-de-donnees'],
      notes: moteur.puces(
        'Lire le courriel à voix haute, puis faire télécharger le classeur depuis le poste.',
        'Vérifier qu’il s’ouvre sans réparation et que l’onglet Commandes est visible.',
        'Annoncer la séance : six niveaux, deux pauses de 15 minutes, un tableau de bord pour le comité de jeudi.',
      ),
    },
    'hero',
    {
      title: 'Expert Data : de la donnée brute à la décision',
      subtitle:
        'Lundi 12 octobre, 8 h. Nadia Ferrand, directrice commerciale de Norvane Équipement, écrit : « Voici l’export des ventes depuis janvier 2025. Qu’est-ce qui ne va pas dans mon réseau ? J’ai le comité de direction jeudi. »',
      bullets: [
        'Bachelor 3 · Outils informatiques du manager · séance 1',
        'Norvane Équipement : 12 agences, 36 commerciaux, 40 produits et services',
        'Un export brut des ventes, de janvier 2025 à septembre 2026, à ouvrir dans Excel',
        'Données fictives',
      ],
    },
    {
      pieceJointe: {
        libelle: 'Export des ventes Norvane (classeur Excel)',
        fichier: CLASSEURS_B3_01.brut,
      },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-03-CARTE',
      titre: 'La carte de la séance',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['jeu-de-donnees', 'nettoyage', 'tableau-de-bord'],
      notes: moteur.puces(
        'Parcourir les six cases en une phrase chacune : ce qu’on livre, la règle qu’on écrit.',
        'Annoncer le cahier de règles : trois écrans le recueillent, avant chaque pause et en fin de séance.',
        'Séance 2 : l’agent Data Analyst appliquera ces règles ; une règle floue le fera se tromper.',
      ),
    },
    'grid',
    {
      title: 'La carte de la séance',
      subtitle:
        'Six niveaux, de l’export brut à la décision. Séance 2 : un agent appliquera vos règles.',
      items: [
        {
          title: 'Niveau 1 · Comprendre',
          description:
            'Livrable : le dictionnaire des données. Règle du cahier : comment relier deux tables.',
        },
        {
          title: 'Niveau 2 · Nettoyer',
          description:
            'Livrable : un export propre et sa colonne de contrôle. Règle du cahier : ce qui se corrige seul, ce qui se demande.',
        },
        {
          title: 'Niveau 3 · Transformer',
          description:
            'Livrable : les colonnes région et catégorie, des totaux sous conditions. Règle du cahier : nommer le problème avant la fonction.',
        },
        {
          title: 'Niveau 4 · Modéliser',
          description:
            'Livrable : le tableau structuré et le TCD de la direction. Règle du cahier : sur quoi construire un calcul qui dure.',
        },
        {
          title: 'Niveau 5 · Visualiser',
          description:
            'Livrable : le graphique du CA face à l’objectif. Règle du cahier : quelle question avant quel graphique.',
        },
        {
          title: 'Niveau 6 · Décider',
          description:
            'Livrable : le tableau de bord et trois recommandations. Règle du cahier : comment écrire une recommandation.',
        },
      ],
    },
  ),
  {
    screenId: 'B3-01-A1-04-VOTE-PART-ET-CLE',
    titre: 'Vote : le fichier et Dupont, Bordeaux',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 3,
    concepts: ['qualite-des-donnees', 'cle-et-relation'],
    notes: moteur.puces(
      'Temps « réfléchir » du niveau 1 : deux votes non notés.',
      'Première question sans révélation : la réponse tombe à la correction de l’exercice 4 ; noter au tableau la répartition des votes.',
      'Deuxième question : entre 30 et 70 % de bonnes réponses, débat en binôme avant la révélation.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a1-part-douteuse',
          'qualite-des-donnees',
          false,
          'Dans un export commercial d’environ 4 000 lignes, quelle part des lignes est fausse ou douteuse, à votre avis ?',
          'Environ 15 % des lignes',
          [
            ['Moins de 1 % des lignes', 'texte-pris-pour-nombre'],
            ['Environ 5 % des lignes', 'casse-non-normalisee'],
            ['Plus de 30 % des lignes', 'doublons-supprimes-sur-une-colonne'],
          ],
        ),
        moteur.vote(
          'b3-01-a1-cle-client',
          'cle-et-relation',
          false,
          '« Dupont – Bordeaux » suffit-il à identifier un client de Norvane ?',
          'Non : il faut un identifiant attribué par le système',
          [
            ['Oui : le nom et la ville suffisent', 'libelle-pris-pour-cle'],
            ['Non : il faut aussi le code postal', 'libelle-pris-pour-cle'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Dupont, Bordeaux : deux clients',
        lignes: [
          'L’onglet Clients compte deux Dupont à Bordeaux : Dupont Bureautique et Dupont & Fils. Le nom et la ville ne les distinguent pas.',
          'Il compte aussi des clients saisis deux fois, sous deux client_id : un libellé se trompe, un identifiant attribué par le système ne se trompe pas.',
          'La part des lignes fausses ou douteuses se révèle à la correction de l’exercice 4.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-05-COURS-DONNEE',
      titre: 'Cours : lire un jeu de données',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['jeu-de-donnees', 'granularite'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 2 : 6 min d’exposition au plus.',
        'Faire dire pour chaque type ce qu’on a le droit de calculer : on additionne une quantité, jamais un identifiant.',
        'Faire finir à voix haute la phrase « une ligne de l’export, c’est… » avant l’exercice 2.',
      ),
    },
    'lesson',
    {
      title: 'Lire un jeu de données avant de calculer',
      subtitle: 'Trace écrite · niveau 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Observation et variable',
          text: 'Une observation est une ligne : un fait enregistré. Une variable est une colonne : une caractéristique de chaque observation. Une observation par ligne, une variable par colonne, un en-tête par colonne.',
        },
        {
          kind: 'property',
          title: 'Cinq types de variables, et la donnée manquante',
          text: 'Le type dit le calcul permis.',
          steps: [
            'Identifiant : compter, jamais additionner.',
            'Numérique : additionner, moyenner.',
            'Catégorie : compter, regrouper.',
            'Date : calculer des durées.',
            'Booléen : compter les VRAI.',
            'Vide : donnée manquante, pas un zéro.',
          ],
        },
        {
          kind: 'method',
          title: 'Trouver la granularité avant de compter',
          text: 'Finir la phrase « une ligne = … » : ici, un produit dans une commande, qui occupe une ou plusieurs lignes.',
          steps: [
            'Repérer la colonne qui se répète (n_commande).',
            'Compter des commandes = compter des n_commande distincts.',
          ],
        },
        {
          kind: 'example',
          title: 'La source de vérité',
          text: 'La ville d’un client se lit dans l’onglet Clients, saisi une fois. La colonne ville de l’export n’en est qu’une copie, avec ses fautes : en cas de doute, Clients fait foi.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-06-COURS-RELATIONS',
      titre: 'Cours : des tables reliées par des clés',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['cle-et-relation'],
      notes: moteur.puces(
        '3 min ; montrer les onglets du classeur pendant la lecture du schéma.',
        'Revenir sur le vote : deux Dupont à Bordeaux, et des clients saisis deux fois.',
        'Transition : « Classez les colonnes de Commandes : exercice 1. »',
      ),
    },
    'lesson',
    {
      title: 'Des tables reliées par des clés',
      subtitle: 'Trace écrite · niveau 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Clé primaire, clé étrangère',
          text: 'Une clé primaire identifie chaque ligne d’une table : client_id dans Clients, produit_id dans Produits. Recopiée dans une autre table, elle devient une clé étrangère : le client_id d’une ligne de Commandes renvoie à un seul client.',
        },
        {
          kind: 'property',
          title: 'Le schéma du classeur Norvane',
          text: 'Commandes est au centre : chaque ligne pointe vers un client, un produit et une agence.',
          steps: [
            'Clients ← client_id → Commandes',
            'Commandes → produit_id → Produits',
            'Commandes → agence_id → Agences',
            'Agences → agence_id → Objectifs, un objectif par agence et par mois',
          ],
        },
        {
          kind: 'method',
          title: 'Reconnaître une bonne clé',
          text: 'Une clé est unique (deux lignes ne la partagent pas), stable (elle ne change pas quand le client déménage) et sans signification (un code attribué par le système, pas un nom).',
        },
        {
          kind: 'example',
          title: 'Pourquoi « Dupont, Bordeaux » n’est pas une clé',
          text: 'Deux entreprises peuvent porter le même nom dans la même ville ; une même entreprise peut s’écrire « Dupont SARL » ou « DUPONT ». Un nom et une ville se trompent ; un identifiant ne se trompe pas.',
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A1-07-TRI-COLONNES',
      titre: 'Exercice 1 — Le dictionnaire des données',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 3,
      concepts: ['jeu-de-donnees', 'cle-et-relation'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 2 min',
        'Réflexion : relire les en-têtes de l’onglet Commandes avant de trier.',
        'Pièges : n_commande pris pour une mesure, parce qu’il contient des chiffres ; ville prise pour un identifiant.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-01-a1-dictionnaire',
            intitule:
              'Classez chaque colonne de l’onglet Commandes selon son type.',
          },
          'jeu-de-donnees',
          [
            ['identifiant', 'Identifiant'],
            ['date', 'Date'],
            ['categorie', 'Catégorie'],
            ['numerique', 'Numérique'],
            ['booleen', 'Booléen'],
          ],
          [
            {
              id: 'n-commande',
              libelle: 'n_commande',
              categorie: 'identifiant',
              confusion: 'identifiant-pris-pour-nombre',
              justification:
                'un code de commande : on le compte, on ne l’additionne pas',
            },
            {
              id: 'client-id',
              libelle: 'client_id',
              categorie: 'identifiant',
              confusion: 'identifiant-pris-pour-nombre',
              justification:
                'la clé qui renvoie à un client de l’onglet Clients',
            },
            {
              id: 'commercial-id',
              libelle: 'commercial_id',
              categorie: 'identifiant',
              confusion: 'identifiant-pris-pour-nombre',
              justification: 'le code du commercial qui a pris la commande',
            },
            {
              id: 'produit-id',
              libelle: 'produit_id',
              categorie: 'identifiant',
              confusion: 'identifiant-pris-pour-nombre',
              justification: 'la clé qui renvoie à l’onglet Produits',
            },
            {
              id: 'agence-id',
              libelle: 'agence_id',
              categorie: 'identifiant',
              confusion: 'libelle-pris-pour-cle',
              justification:
                'la clé qui renvoie à l’onglet Agences, pas le nom de la ville',
            },
            {
              id: 'date-commande',
              libelle: 'date_commande',
              categorie: 'date',
              confusion: 'type-de-variable-confondu',
              justification: 'le jour de la commande',
            },
            {
              id: 'date-livraison',
              libelle: 'date_livraison',
              categorie: 'date',
              confusion: 'type-de-variable-confondu',
              justification:
                'le jour de la livraison : avec date_commande, il donne le délai',
            },
            {
              id: 'ville',
              libelle: 'ville',
              categorie: 'categorie',
              confusion: 'libelle-pris-pour-cle',
              justification:
                'on regroupe par ville, mais une ville n’identifie pas un client',
            },
            {
              id: 'quantite',
              libelle: 'quantite',
              categorie: 'numerique',
              confusion: 'type-de-variable-confondu',
              justification: 'une mesure qu’on additionne',
            },
            {
              id: 'prix-unitaire',
              libelle: 'prix_unitaire_ht',
              categorie: 'numerique',
              confusion: 'type-de-variable-confondu',
              justification: 'un montant en euros',
            },
            {
              id: 'remise',
              libelle: 'remise',
              categorie: 'numerique',
              confusion: 'type-de-variable-confondu',
              justification: 'un taux : 0,15 vaut 15 %',
            },
            {
              id: 'ca-ht',
              libelle: 'ca_ht',
              categorie: 'numerique',
              confusion: 'type-de-variable-confondu',
              justification: 'le montant de la ligne, qu’on additionne',
            },
            {
              id: 'facturee',
              libelle: 'facturee',
              categorie: 'booleen',
              confusion: 'type-de-variable-confondu',
              justification: 'VRAI ou FAUX : on compte les VRAI',
            },
          ],
        ),
      },
    },
    {
      minutes: 1,
      notes: [
        'Corriger catégorie par catégorie, en commençant par la carte la plus ratée (taux d’erreur au pupitre).',
        'Transition : « Une ligne, c’est quoi ? Exercice 2. »',
      ],
    },
    [
      [
        'identifiant',
        'Cinq identifiants : n_commande, client_id, commercial_id, produit_id et agence_id. Ce sont des codes : on les compte, on ne les additionne jamais, même quand ils contiennent des chiffres.',
      ],
      [
        'date',
        'date_commande et date_livraison : deux dates, dont l’écart donne le délai de livraison.',
      ],
      [
        'categorie',
        'ville est une catégorie : on compte et on regroupe par ville, mais on ne relie pas deux tables par elle.',
      ],
      [
        'numerique',
        'quantite, prix_unitaire_ht, remise et ca_ht : des mesures qu’on additionne ou dont on fait la moyenne. La remise est un taux.',
      ],
      ['booleen', 'facturee vaut VRAI ou FAUX : on compte les VRAI.'],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A1-08-ATELIER-GRANULARITE',
      titre: 'Exercice 2 — Une ligne, c’est quoi ?',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 3,
      concepts: ['granularite'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 2 min',
        'Réflexion : faire dire ce qu’on va compter, des lignes ou des commandes, avant de filtrer.',
        'Piège : compter une commande là où l’on demande des lignes.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Une ligne, c’est quoi ?',
        consigne:
          'Dans l’onglet Commandes du classeur brut, filtrez la colonne n_commande sur la commande C-10234.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b3-01-a1-granularite',
            'granularite',
            true,
            'L’onglet Commandes compte-t-il plus de lignes que de commandes, autant, ou moins ?',
            'Plus de lignes que de commandes',
            [
              [
                'Autant de lignes que de commandes',
                'lignes-comptees-pour-commandes',
              ],
              [
                'Moins de lignes que de commandes',
                'lignes-comptees-pour-commandes',
              ],
            ],
          ),
          questionChiffree(
            'b3-01-a1-lignes-commande',
            'granularite',
            'Combien de lignes porte la commande C-10234 ?',
            'lignes',
            ['commandes-comptees-pour-lignes'],
          ),
        ],
      },
    },
    {
      minutes: 1,
      notes: [
        'Corriger les deux questions ensemble : une commande, plusieurs lignes.',
        'Transition : « Le fichier a-t-il d’autres surprises ? Un vote. »',
      ],
    },
    [
      [
        'b3-01-a1-granularite',
        'Une commande occupe une à cinq lignes, une par produit : le fichier compte plus de lignes que de commandes. Pour compter des commandes, on compte des n_commande distincts.',
      ],
      [
        'b3-01-a1-lignes-commande',
        'Filtrée sur C-10234, la colonne n_commande montre trois lignes : trois produits d’une même commande. Compter les commandes distinctes donnerait 1.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A1-09-VOTE-CA-TEXTE',
    titre: 'Vote : un CA aligné à gauche',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 2,
    concepts: ['nettoyage'],
    notes: moteur.puces(
      'Temps « réfléchir » du niveau 2 : vote non noté, 1 min de vote et 1 min de révélation.',
      'Faire repérer dans le fichier une cellule de ca_ht alignée à gauche : l’indice d’un texte.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-01-a1-ca-texte',
          'nettoyage',
          false,
          'Dans la colonne ca_ht, une cellule affiche « 1 250,00 € », alignée à gauche. Que fait =SOMME(L:L) de cette cellule ?',
          'Elle l’ignore, sans aucun message',
          [
            ['Elle l’ajoute au total', 'texte-pris-pour-nombre'],
            ['Elle affiche une erreur #VALEUR!', 'texte-pris-pour-nombre'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Le pire cas : un total faux, sans alerte',
        lignes: [
          'SOMME ignore une cellule de texte sans prévenir : le total est faux et rien ne le signale.',
          'Un montant aligné à gauche dans une colonne de nombres est un indice : c’est du texte.',
          'ESTNUM renvoie FAUX pour un nombre stocké en texte : on vérifie avant d’additionner.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-10-COURS-GRILLE',
      titre: 'Cours : faux, suspect, automatique, humain',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['qualite-des-donnees'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 2 : 6 min d’exposition au plus.',
        'Faire poser les deux questions de la grille : l’erreur est-elle certaine ? la bonne valeur est-elle dans le fichier ?',
        'Insister sur la case vide : c’est la règle que l’agent de la séance 2 devra respecter.',
      ),
    },
    'lesson',
    {
      title: 'La grille de la qualité des données',
      subtitle: 'Trace écrite · niveau 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Faux ou suspect',
          text: 'Une donnée fausse l’est à coup sûr : une livraison antérieure à sa commande, un produit absent du référentiel. Une donnée suspecte l’est peut-être : une quantité négative peut être une erreur ou un avoir. Seul un humain qui connaît l’activité tranche.',
        },
        {
          kind: 'property',
          title: 'La grille 2 × 2',
          text: 'On croise la certitude (faux, suspect) et le correcteur (automatique, humain).',
          steps: [
            'Faux · automatique : on corrige par formule, en gardant la trace (casse, espaces, nombre en texte, doublon exact).',
            'Faux · humain : on signale et on demande la bonne valeur (produit inconnu, commercial absent).',
            'Suspect · humain : on signale et on demande s’il s’agit d’une erreur.',
            'Suspect · automatique : case vide.',
          ],
        },
        {
          kind: 'method',
          title:
            'Rien de douteux ne se corrige seul ; on signale, on ne supprime pas',
          text: 'Une colonne controle marque chaque ligne « OK » ou « À vérifier » ; les lignes douteuses partent dans un onglet Quarantaine avec leur motif. Supprimer une ligne efface la question : personne ne saura qu’il fallait la poser.',
        },
        {
          kind: 'example',
          title: 'Une quantité de −2',
          text: 'Erreur de saisie ou retour de marchandise, donc avoir ? Le tableur ne peut pas le savoir : on signale la ligne et on demande au service commercial.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-01-A1-11-COURS-OUTILS',
      titre: 'Cours : les outils du nettoyage',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['nettoyage'],
      notes: moteur.puces(
        '3 min ; chaque outil répond à une case « faux · automatique » de la page précédente.',
        'Montrer dans le fichier une ville entourée d’espaces : SUPPRESPACE ne se voit qu’au résultat.',
        'Transition : « Voyons-les à l’œuvre sur deux cellules. »',
      ),
    },
    'lesson',
    {
      title: 'Les outils du nettoyage',
      subtitle: 'Trace écrite · niveau 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'method',
          title: 'Une anomalie, un outil',
          text: 'Chaque anomalie « faux · automatique » a son outil.',
          steps: [
            'Espaces en trop : SUPPRESPACE(E2).',
            'Casse : NOMPROPRE(E2) écrit « Bordeaux » ; MAJUSCULE et MINUSCULE existent aussi.',
            'Nombre en texte : SUBSTITUE retire le symbole et les espaces, puis CNUM convertit le texte en nombre.',
            'Date en texte au format ISO « 2026-03-15 » : DATEVAL la convertit en date.',
            'Doublons exacts : Données › Supprimer les doublons, toutes les colonnes cochées, sur une copie. Valeurs distinctes : le même outil, sur une colonne copiée à part, annonce combien il en reste.',
            'Colonne controle : SI et OU renvoient « À vérifier » ou « OK ».',
          ],
        },
        {
          kind: 'property',
          title: 'Nettoyer à côté, jamais dessus',
          text: 'On nettoie dans une nouvelle colonne : la donnée brute reste, on peut comparer et revenir en arrière. On ne colle en valeurs qu’une fois le contrôle fait.',
        },
        {
          kind: 'example',
          title: 'Si vous avez Excel 365 : Power Query',
          text: 'Données › À partir d’un tableau ou d’une plage : Power Query enregistre chaque étape du nettoyage et la rejoue d’un clic au prochain export.',
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-01-A1-12-EXEMPLE-NETTOYAGE',
      titre: 'Exemple guidé : deux cellules à soigner',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 2,
      concepts: ['nettoyage'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Le fichier sépare les milliers par une espace ordinaire. Les vrais exports utilisent souvent l’espace insécable, UNICAR(160) : SUBSTITUE(L2;UNICAR(160);"") la retire.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-01-a1-exemple-nettoyage',
          enonce:
            'Deux cellules de l’onglet Commandes : en E2, la ville « bordeaux », entourée d’espaces ; en L2, le ca_ht saisi comme le texte « 1 250,00 € ».',
          etapes: [
            {
              id: 'ville',
              intitule: 'La ville',
              raisonnement:
                'Dans une nouvelle colonne, =NOMPROPRE(SUPPRESPACE(E2)) retire les espaces en trop, puis met une majuscule initiale : « Bordeaux ».',
              invite:
                'Quelle formule rend « Bordeaux » dans une nouvelle colonne ?',
            },
            {
              id: 'montant',
              intitule: 'Le montant',
              raisonnement:
                'SUBSTITUE retire d’abord « € », puis l’espace des milliers ; CNUM convertit le texte qui reste. =CNUM(SUBSTITUE(SUBSTITUE(L2;" €";"");" ";"")) rend le nombre 1250.',
              invite: 'Quelle formule convertit « 1 250,00 € » en nombre ?',
            },
            {
              id: 'verifier',
              intitule: 'Vérifier',
              raisonnement:
                'ESTNUM renvoie VRAI pour un nombre et FAUX pour un texte : une colonne entière de VRAI garantit que SOMME n’oubliera rien.',
              invite:
                'Comment s’assurer que la conversion a réussi sur toute la colonne ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'S’arrêter sur l’ordre des fonctions : SUPPRESPACE d’abord, NOMPROPRE ensuite ; SUBSTITUE d’abord, CNUM ensuite.',
        'Transition : « Avant de nettoyer, classons les anomalies : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A1-13-TRI-ANOMALIES',
      titre: 'Exercice 3 — Classer les anomalies',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 4,
      concepts: ['qualite-des-donnees'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 3 min',
        'Réflexion : rappeler les deux questions de la grille avant de trier.',
        'Pièges : corriger seul une date douteuse ; supprimer une ligne au lieu de la signaler.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-01-a1-anomalies',
            intitule:
              'Classez chaque anomalie du fichier dans la grille de la qualité des données.',
          },
          'qualite-des-donnees',
          [
            ['faux-automatique', 'Faux · correction automatique'],
            ['faux-humain', 'Faux · à demander à un humain'],
            ['suspect-automatique', 'Suspect · correction automatique'],
            ['suspect-humain', 'Suspect · à demander à un humain'],
          ],
          [
            {
              id: 'ville-mal-ecrite',
              libelle: 'Ville écrite « BORDEAUX » ou entourée d’espaces',
              categorie: 'faux-automatique',
              confusion: 'suppression-au-lieu-de-signalement',
              justification:
                'erreur certaine ; SUPPRESPACE et NOMPROPRE la corrigent',
            },
            {
              id: 'ca-en-texte',
              libelle: 'ca_ht stocké en texte : « 1 250,00 € »',
              categorie: 'faux-automatique',
              confusion: 'suppression-au-lieu-de-signalement',
              justification:
                'erreur certaine ; SUBSTITUE puis CNUM la corrigent',
            },
            {
              id: 'ligne-en-double',
              libelle: 'Ligne exportée deux fois, à l’identique',
              categorie: 'faux-automatique',
              confusion: 'suppression-au-lieu-de-signalement',
              justification:
                'doublon exact : Supprimer les doublons, toutes colonnes cochées',
            },
            {
              id: 'ca-mal-calcule',
              libelle: 'ca_ht différent de quantité × prix × (1 − remise)',
              categorie: 'faux-automatique',
              confusion: 'suppression-au-lieu-de-signalement',
              justification: 'la bonne valeur se recalcule depuis la ligne',
            },
            {
              id: 'produit-inconnu',
              libelle: 'produit_id absent du référentiel Produits',
              categorie: 'faux-humain',
              confusion: 'suppression-au-lieu-de-signalement',
              justification:
                'erreur certaine, mais le bon produit n’est pas dans le fichier',
            },
            {
              id: 'livraison-avant-commande',
              libelle: 'Livraison antérieure à la commande',
              categorie: 'faux-humain',
              confusion: 'suppression-au-lieu-de-signalement',
              justification:
                'impossible, mais laquelle des deux dates est fausse ?',
            },
            {
              id: 'date-autre-systeme',
              libelle: 'Date « 05/04/26 » venue d’un autre système',
              categorie: 'suspect-humain',
              confusion: 'suspect-corrige-sans-validation',
              justification: '5 avril ou 4 mai ? Seul l’émetteur le sait',
            },
            {
              id: 'quantite-negative',
              libelle: 'Quantité négative',
              categorie: 'suspect-humain',
              confusion: 'suspect-corrige-sans-validation',
              justification: 'erreur de saisie ou avoir : on demande',
            },
            {
              id: 'prix-dix-fois',
              libelle: 'Prix unitaire égal à dix fois le prix catalogue',
              categorie: 'suspect-humain',
              confusion: 'suspect-corrige-sans-validation',
              justification:
                'faute de virgule ou produit sur mesure : on demande',
            },
            {
              id: 'client-en-double',
              libelle:
                'Deux client_id pour la même raison sociale dans la même ville',
              categorie: 'suspect-humain',
              confusion: 'suspect-corrige-sans-validation',
              justification: 'doublon ou deux établissements : on demande',
            },
          ],
        ),
      },
    },
    {
      minutes: 1,
      notes: [
        'Corriger case par case ; finir par la case vide.',
        'Transition : « Au travail sur le vrai fichier : exercice 4. »',
      ],
    },
    [
      [
        'faux-automatique',
        'Ville mal écrite, nombre en texte, doublon exact, ca_ht mal calculé : l’erreur est certaine et la bonne valeur se déduit du fichier. On corrige par formule, dans une nouvelle colonne.',
      ],
      [
        'faux-humain',
        'Produit inconnu, livraison avant la commande : l’erreur est certaine, mais la bonne valeur n’est pas dans le fichier. On signale et on demande.',
      ],
      [
        'suspect-automatique',
        'Case vide : une donnée douteuse ne se corrige jamais seule. Lire « 05/04/26 » comme un 5 avril, c’est parier sur le format.',
      ],
      [
        'suspect-humain',
        'Date d’un autre système, quantité négative, prix dix fois trop élevé, client en double : peut-être une erreur, peut-être un avoir, un produit sur mesure ou deux établissements. On signale et on demande.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-01-A1-14-ATELIER-NETTOYAGE',
      titre: 'Exercice 4 — Nettoyer l’export',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 10,
      concepts: ['nettoyage', 'qualite-des-donnees'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 9 min',
        'Réflexion : faire dire l’ordre du travail : copie, colonnes nettoyées, doublons, contrôle.',
        'Annoncer le palier défi aux plus rapides : il se corrige oralement, sans note.',
        'Pièges : dédoublonner sur n_commande seule ; additionner avant de convertir ; compter les villes avant d’en retirer les espaces ; convertir les dates avant le contrôle.',
        'Villes distinctes : copier la colonne N en valeurs à part, puis Supprimer les doublons ; sous Excel 365, =NBVAL(UNIQUE(N2:N4099)).',
      ),
      proprietes: {
        intitule: 'Exercice 4 — Nettoyer l’export',
        consigne:
          'Essentiel, sur une copie de l’onglet Commandes : nettoyez ville et ca_ht dans deux nouvelles colonnes, en N et O, sans insérer de colonne ; supprimez les doublons exacts, toutes les colonnes cochées ; ajoutez une colonne controle sur les dates brutes, =SI(OU(C2<B2;I2<=0;G2="");"À vérifier";"OK"), où C est date_livraison, B date_commande, I quantite et G commercial_id. Défi : convertissez les dates ISO par DATEVAL, recalculez ca_ht et signalez les écarts de plus d’un euro.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffree(
            'b3-01-a1-lignes-uniques',
            'nettoyage',
            'Combien de lignes reste-t-il après la suppression des doublons exacts ?',
            'lignes',
            ['doublons-supprimes-sur-une-colonne'],
          ),
          questionChiffree(
            'b3-01-a1-ca-total',
            'nettoyage',
            'Quel est le CA total HT des lignes restantes, une fois les montants en texte convertis ?',
            '€',
            ['texte-pris-pour-nombre'],
          ),
          questionChiffree(
            'b3-01-a1-villes',
            'nettoyage',
            'Combien de villes distinctes compte la colonne ville nettoyée ?',
            'villes',
            ['espaces-non-supprimes'],
          ),
          questionChiffree(
            'b3-01-a1-a-verifier',
            'qualite-des-donnees',
            'Combien de lignes la colonne controle marque-t-elle « À vérifier » ?',
            'lignes',
            ['suspect-corrige-sans-validation'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).',
        'Révéler la part des lignes fausses ou douteuses : c’est la réponse à la première question du vote d’ouverture.',
        'Défi : DATEVAL lit « 04/05/26 » comme le 4 mai ; une date d’un autre système ne se convertit pas sans demander.',
      ],
    },
    [
      [
        'b3-01-a1-lignes-uniques',
        'L’export compte 4 144 lignes, dont 46 exportées deux fois : il en reste 4 098. Dédoublonner sur n_commande seule ne garderait qu’une ligne par commande : 1 618 lignes, et des produits perdus.',
      ],
      [
        'b3-01-a1-ca-total',
        'Une fois les montants en texte convertis, le CA total HT vaut 1 340 208 €. SOMME sans conversion laisse de côté les montants en texte : 1 286 319 €, sans alerte.',
      ],
      [
        'b3-01-a1-villes',
        'NOMPROPRE(SUPPRESPACE(E2)) ramène chaque variante à une seule écriture : il reste 48 villes. Le comptage d’Excel ignore la casse : ce sont les espaces en trop qui font compter une même ville deux fois.',
      ],
      [
        'b3-01-a1-a-verifier',
        'La colonne controle marque 85 lignes « À vérifier » : livraisons antérieures à la commande, quantités négatives, commercial absent et dates restées en texte. Avec les anomalies corrigées par formule, environ 16 % des lignes uniques étaient fausses ou douteuses : la réponse au premier vote de la séance. Convertir les dates par DATEVAL avant le contrôle aurait corrigé seul des dates douteuses, et n’en aurait signalé que 39.',
      ],
    ],
  ),
  {
    screenId: 'B3-01-A1-15-REGLES-ACTE-1',
    titre: 'Cahier de règles : niveaux 1 et 2',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 4,
    concepts: ['cle-et-relation', 'qualite-des-donnees'],
    notes: moteur.puces(
      '3 min d’écriture individuelle, puis 1 min pour lire deux règles au pupitre.',
      'Règles modèles, à montrer après la saisie : « Je relie les tables par un identifiant, jamais par un libellé » ; « Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux et je demande. »',
      'Puis pause de 15 minutes ; reprise à 9 h 41 sur le classeur de reprise.',
    ),
    proprietes: {
      metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Avant la pause, vous écrivez les deux premières règles de votre cahier d’analyste. En séance 2, un agent Data Analyst les appliquera à votre place.',
      geste:
        'Écrivez une règle par niveau : une phrase impérative et vérifiable.',
      consequence:
        'Une règle vague (« faire attention aux données ») ne guide ni un collègue ni un agent.',
      questionsLibres: [
        {
          id: 'b3-01-a1-regles:regle-comprendre',
          question:
            'Niveau 1 · Comprendre : votre règle pour relier deux tables.',
          placeholder: 'Je relie…',
        },
        {
          id: 'b3-01-a1-regles:regle-nettoyer',
          question:
            'Niveau 2 · Nettoyer : votre règle pour une donnée fausse ou douteuse.',
          placeholder: 'Je corrige seul… ; je signale…',
        },
      ],
    },
  },
];
