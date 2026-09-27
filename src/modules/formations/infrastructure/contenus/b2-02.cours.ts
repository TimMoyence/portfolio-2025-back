import { CONCEPTS_DU_B2_02 } from '../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import * as moteur from './briques';

const DELAIS_DU_TRIMESTRE = [
  42, 25, 58, 31, 146, 38, 47, 18, 62, 44, 35, 52, 28, 75, 40, 30, 55, 34, 50,
  45,
] as const;

const CLIENTS_DU_TRIMESTRE = [
  'Club nautique',
  'Particulier',
  'Chantier naval',
  'Club nautique',
  'Chantier naval',
  'Loueur de bateaux',
  'Club nautique',
  'Particulier',
  'Chantier naval',
  'Loueur de bateaux',
  'Club nautique',
  'Chantier naval',
  'Particulier',
  'Chantier naval',
  'Club nautique',
  'Loueur de bateaux',
  'Chantier naval',
  'Club nautique',
  'Loueur de bateaux',
  'Club nautique',
] as const;

const FACTURE_EN_LITIGE = 'F105';

function numeroDeFacture(rang: number): string {
  return `F${101 + rang}`;
}

function serieAvecLitige(): string {
  return DELAIS_DU_TRIMESTRE.map((delai, rang) =>
    numeroDeFacture(rang) === FACTURE_EN_LITIGE ? 'litige' : String(delai),
  ).join(';');
}

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-02-A1-01-DIAGNOSTIC',
    titre: 'Diagnostic : le délai du milieu',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['mediane'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun choisit sans calculatrice.',
      'Pièges : la moyenne (250 ÷ 5) et la valeur du milieu de la liste non triée (140).',
      'Ne pas corriger à fond : la médiane revient en atelier 1 sur les vingt factures.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-02-a1-diagnostic',
          'mediane',
          true,
          'Cinq clients ont payé leur facture en 35, 20, 140, 25 et 30 jours. Quel délai partage ces cinq clients en deux groupes de même effectif ?',
          '30 jours',
          [
            ['50 jours', 'moyenne-lue-comme-mediane'],
            ['140 jours', 'mediane-sans-tri'],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-02-ACCROCHE',
      titre: 'Résumer une série sans la trahir',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Rappeler en une phrase le comité de B2-01 : Atelier Rivage a décidé, la banque veut maintenant des chiffres.',
        'Question à la classe : « Un seul nombre peut-il résumer vingt délais ? »',
        'Transition : « Voici le courriel de la banque. »',
      ),
    },
    'hero',
    {
      title: 'Résumer une série sans la trahir',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Lundi 11 janvier 2027 : la banque demande le délai de paiement des clients professionnels avant d’accorder une facilité de caisse.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · deuxième cours de mathématiques',
        '3 h 30 · 6 actes',
      ],
    },
  ),
  {
    screenId: 'B2-02-A1-03-MISSION',
    titre: 'Votre mission : répondre à la banque',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 4,
    concepts: ['serie-statistique'],
    notes: moteur.puces(
      'Lecture à voix haute (90 s), puis 2 min d’écriture individuelle.',
      'Au pupitre, lire deux réponses à « Combien de nombres faut-il ? » : l’une propose un seul délai, l’autre un délai et un écart. C’est le fil de la séance.',
      'Transition : « Voici le chemin : six actes pour répondre à la banque, en commençant par les vingt factures. »',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 8 h 40. Hélène Garnier, la dirigeante, vous transfère le courriel de la chargée d’affaires de la banque : « Pour dimensionner votre facilité de caisse, indiquez-nous le délai de paiement de vos clients professionnels et sa régularité. » Samir Haddad a déjà préparé une diapositive. Hélène : « Vérifiez avant que je l’envoie. »',
      geste:
        'Avant de choisir un chiffre, répondez par écrit aux trois questions ci-dessous.',
      consequence:
        'Si la banque dimensionne la facilité de caisse sur un délai trompeur, Atelier Rivage peut manquer de trésorerie au moment où un gros client tarde à payer.',
      questionsLibres: [
        {
          id: 'b2-02-a1-mission:quoi',
          question: 'Que mesure-t-on exactement, et sur quelles factures ?',
          placeholder: 'Le délai entre…, pour les factures…',
        },
        {
          id: 'b2-02-a1-mission:combien',
          question: 'Un seul nombre suffit-il à la banque ? Pourquoi ?',
          placeholder: 'Un délai typique, un écart…',
        },
        {
          id: 'b2-02-a1-mission:verifier',
          question: 'Que faudrait-il vérifier avant d’envoyer un chiffre ?',
          placeholder: 'Une valeur, un calcul, une pièce…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-04-PLAN',
      titre: 'Le plan de la séance',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['serie-statistique'],
      notes: '',
    },
    'method-path',
    {
      title: 'Le plan de la séance',
      steps: [
        {
          id: 'decrire',
          title: 'Acte 1 · Décrire la série',
          question: 'Qui, quoi, combien ?',
          proof: 'Population, caractère, effectif, unité, période.',
          result: 'La fiche d’identité des vingt délais.',
        },
        {
          id: 'centrer',
          title: 'Acte 2 · Trouver le centre',
          question: 'Moyenne ou médiane ?',
          proof: 'Tri, rang du milieu, valeur extrême.',
          result: 'Un délai typique qui ne trompe pas.',
        },
        {
          id: 'disperser',
          title: 'Acte 3 · Mesurer l’écart',
          question: 'Les délais sont-ils réguliers ?',
          proof: 'Étendue, quartiles, écart-type.',
          result: 'Une mesure de la régularité des paiements.',
        },
        {
          id: 'representer',
          title: 'Acte 4 · Outiller et représenter',
          question: 'Le tableur et la boîte disent-ils la même chose ?',
          proof: 'Fonctions statistiques, conventions, boîte à moustaches.',
          result: 'Une feuille contrôlable et une boîte lisible.',
        },
        {
          id: 'regrouper',
          title: 'Acte 5 · Regrouper et choisir',
          question: 'Que faire quand les valeurs sont en classes ?',
          proof: 'Effectifs cumulés, centres, densité, histogramme.',
          result: 'La note à la banque : un centre, un écart, une limite.',
        },
        moteur.ETAPE_TRANSFERER,
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-05-FACTURES',
      titre: 'Les vingt factures du 2e trimestre 2026',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire repérer la facture F105, contestée par le client, et le délai qui dépasse de loin les autres.',
        'Transition : « Avant de calculer, nommons ce que l’on regarde. »',
      ),
    },
    'table',
    {
      title: 'Les vingt factures du 2e trimestre 2026',
      subtitle:
        'Factures aux clients professionnels émises d’avril à juin 2026, toutes encaissées au 31 décembre 2026.',
      columns: [
        { key: 'facture', label: 'Facture' },
        { key: 'client', label: 'Type de client' },
        { key: 'delai', label: 'Délai de paiement (jours)' },
      ],
      rows: DELAIS_DU_TRIMESTRE.map((delai, rang) => ({
        facture: numeroDeFacture(rang),
        client:
          numeroDeFacture(rang) === FACTURE_EN_LITIGE
            ? `${CLIENTS_DU_TRIMESTRE[rang]} (facture contestée)`
            : CLIENTS_DU_TRIMESTRE[rang],
        delai: String(delai),
      })),
      note: 'Délai = nombre de jours entre l’émission de la facture et son encaissement. Données fictives Atelier Rivage, créées pour ce cours.',
    },
  ),
  ...moteur.suiviDeSaCorrection(
    {
      screenId: 'B2-02-A1-06-CORRECTION',
      titre: 'Correction : les mots de la statistique',
      sousTitre:
        'Une série statistique décrit une population d’individus selon un caractère ; l’effectif compte les individus, l’effectif cumulé les compte jusqu’à une valeur.',
      dureeMinutes: 1,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Commencer par les deux cartes les plus ratées (taux d’erreur au pupitre).',
        'Faire dire la différence entre « 3 factures au-delà de 60 jours » (un effectif) et « 11 factures en moins de 45 jours » (un effectif cumulé).',
        'Transition : « Une série se présente comme un indicateur : avec sa fiche d’identité. »',
      ),
    },
    {
      screenId: 'B2-02-A1-06-VOCABULAIRE',
      titre: 'Que désigne chaque élément du fichier ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Binômes, 5 min de tri ; annoncer « plus qu’une minute » à 4 min. Chacun envoie depuis son poste.',
        'Cartes les plus ratées : « le type de client » (un caractère, qualitatif) et « 11 factures payées en moins de 45 jours » (un effectif cumulé).',
        'Relance pour toute carte discutée : « Est-ce quelqu’un, ce qu’on observe, ou un compte ? »',
      ),
      proprietes: {
        modalite: 'binome',
        renvoi: 'B2-02-A1-05-FACTURES',
        ...moteur.classement(
          {
            id: 'b2-02-a1-vocabulaire',
            intitule:
              'Classez chaque élément du fichier des factures selon ce qu’il désigne.',
          },
          'serie-statistique',
          [
            ['population', 'Population étudiée'],
            ['individu', 'Individu'],
            ['caractere', 'Caractère observé'],
            ['valeur', 'Valeur du caractère'],
            ['effectif', 'Effectif'],
            ['cumule', 'Effectif cumulé'],
          ],
          [
            {
              id: 'factures',
              libelle: 'Les factures professionnelles du 2e trimestre 2026',
              categorie: 'population',
              confusion: 'role-statistique-confondu',
              justification:
                'l’ensemble étudié : toutes les factures professionnelles du trimestre',
            },
            {
              id: 'f105',
              libelle: 'La facture F105',
              categorie: 'individu',
              confusion: 'role-statistique-confondu',
              justification: 'un élément de la population, observé une fois',
            },
            {
              id: 'delai',
              libelle: 'Le délai de paiement, en jours',
              categorie: 'caractere',
              confusion: 'role-statistique-confondu',
              justification:
                'ce que l’on observe sur chaque facture : un caractère quantitatif',
            },
            {
              id: 'type-client',
              libelle: 'Le type de client (club, chantier, loueur…)',
              categorie: 'caractere',
              confusion: 'role-statistique-confondu',
              justification:
                'un autre caractère observé sur chaque facture, qualitatif cette fois',
            },
            {
              id: 'cent-quarante-six',
              libelle: '« 146 » dans la colonne des délais',
              categorie: 'valeur',
              confusion: 'role-statistique-confondu',
              justification:
                'une valeur prise par le caractère délai, celle de la facture contestée',
            },
            {
              id: 'vingt',
              libelle: 'Le nombre de factures du fichier',
              categorie: 'effectif',
              confusion: 'role-statistique-confondu',
              justification:
                'l’effectif total : le nombre d’individus de la population',
            },
            {
              id: 'au-dela',
              libelle: '3 factures payées en plus de 60 jours',
              categorie: 'effectif',
              confusion: 'effectif-cumule-confondu',
              justification:
                'l’effectif d’une classe de délais, celle au-delà du plafond légal',
            },
            {
              id: 'en-dessous',
              libelle: '11 factures payées en moins de 45 jours',
              categorie: 'cumule',
              confusion: 'effectif-cumule-confondu',
              justification:
                'toutes les factures jusqu’à 45 jours, cumulées depuis le plus petit délai',
            },
          ],
        ),
      },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-07-FICHE-SERIE',
      titre: 'La fiche d’identité d’une série',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Retourner les six cartes une à une, classe entière.',
        'Relance : « Que manque-t-il à la diapositive de Samir ? » (la période, l’effectif, le champ : factures professionnelles seulement).',
        'Préciser : on ne résume une série qu’après l’avoir décrite.',
      ),
    },
    'grid',
    {
      title: 'La fiche d’identité d’une série',
      subtitle:
        'Avant de calculer un résumé, on écrit ce qui a été observé, sur qui, combien de fois, dans quelle unité, quand, et d’où viennent les valeurs.',
      items: [
        {
          title: 'Population',
          description: 'Sur qui porte l’étude ?',
          back: 'Les factures aux clients professionnels émises au 2e trimestre 2026. Pas les particuliers payés comptant, pas les autres trimestres.',
        },
        {
          title: 'Caractère',
          description: 'Qu’observe-t-on ?',
          back: 'Le délai de paiement : quantitatif, mesuré en jours. Le type de client est un caractère qualitatif.',
        },
        {
          title: 'Effectif',
          description: 'Combien d’individus ?',
          back: 'Le nombre de factures observées. Un résumé sans effectif ne dit pas s’il repose sur trois factures ou sur trois cents.',
        },
        {
          title: 'Unité',
          description: 'Dans quelle unité ?',
          back: 'Des jours calendaires, de l’émission de la facture à son encaissement.',
        },
        {
          title: 'Période',
          description: 'Quand ?',
          back: 'Factures émises d’avril à juin 2026, encaissements suivis jusqu’au 31 décembre 2026.',
        },
        {
          title: 'Source',
          description: 'D’où viennent les valeurs ?',
          back: 'Le journal des ventes et les relevés bancaires ; une facture contestée se signale, elle ne se cache pas.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-08-QUESTION-DE-LA-BANQUE',
      titre: 'La question de la banque, en statistique',
      diffusion: 'seance',
      dureeMinutes: 3,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        '2 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Refuser toute réponse sans population ni période.',
        'Attendu : deux mesures, un délai typique (un centre) et une régularité (un écart).',
        'Transition : « Samir a déjà répondu, avec une diapositive. »',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-02-a1-question-banque',
        type: 'reflection',
        question:
          'La banque demande « le délai de paiement de vos clients professionnels et sa régularité ». Réécrivez sa demande en statistique : quelle population, quel caractère, quelle période, et combien de nombres faut-il pour y répondre ?',
        placeholder: 'Population… caractère… période… nombres…',
        competency: 'S’informer · traduire une demande en série statistique',
      },
    },
    {
      correction: {
        expected:
          'Par exemple : pour les factures professionnelles émises au 2e trimestre 2026, quel est le délai de paiement typique, en jours, et à quel point les délais s’en écartent-ils ? Deux nombres au moins : un centre et une mesure de l’écart.',
        nextAction:
          'Vérifiez que votre phrase nomme une population, un caractère avec son unité, une période, et demande deux mesures.',
      },
      renvoi: 'B2-02-A1-03-MISSION',
      cadrageDuRenvoi: { extrait: { champs: ['situation'] } },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-09-DIAPOSITIVE',
      titre: 'La diapositive de Samir pour la banque',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        '30 s de projection sans commentaire, puis : « Peut-on l’envoyer à la banque ? » Pas de réponse orale : on écrit à l’écran suivant.',
        'Faire remarquer qu’un seul chiffre, arrondi, résume vingt délais très différents.',
        'Transition : « Écrivez ce que vous vérifieriez avant de répondre à Hélène. »',
      ),
    },
    'stats',
    {
      title: 'La diapositive de Samir pour la banque',
      subtitle:
        'Samir : « Nos clients professionnels paient en moyenne à 48 jours : nous sommes dans les clous. »',
      stats: [
        {
          value: '48 jours',
          label: 'délai moyen de paiement, arrondi par Samir',
        },
        {
          value: '60 jours',
          label:
            'plafond légal à compter de l’émission de la facture (Code de commerce, art. L441-10)',
        },
        {
          value: '« dans les clous »',
          label: 'la conclusion de la diapositive',
        },
      ],
    },
  ),
  {
    screenId: 'B2-02-A1-10-AUDIT-DIAPOSITIVE',
    titre: 'Audit de la diapositive',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 3,
    concepts: ['choix-du-resume'],
    notes: moteur.puces(
      '2 min d’écriture individuelle, puis révélation au pupitre.',
      'Repérer ceux qui parlent de la facture contestée et ceux qui parlent de l’écart entre les délais.',
      'Avant de révéler, faire trouver la piste fausse : retirer la facture gênante.',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-02-a1-audit-diapositive',
        enonce:
          'Samir résume les vingt délais par un seul chiffre, une moyenne arrondie, et conclut « dans les clous ». Hélène demande si elle peut envoyer la diapositive telle quelle à la banque.',
        invite:
          'Écrivez trois vérifications à faire avant de lui répondre, puis votre réponse en une phrase.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          moteur.strategie(
            'extreme',
            'Repérer les valeurs extrêmes, en particulier la facture contestée, et mesurer leur effet sur la moyenne.',
          ),
          moteur.strategie(
            'milieu',
            'Trier les délais et chercher le délai qui partage les factures en deux moitiés.',
          ),
          moteur.strategie(
            'ecart',
            'Mesurer l’écart entre les délais : une moyenne peut cacher des factures payées bien au-delà de 60 jours.',
          ),
          moteur.strategie(
            'plafond',
            'Compter les factures payées au-delà du plafond légal : une moyenne sous 60 jours ne dit pas que chaque facture l’est.',
          ),
          moteur.strategie(
            'retirer',
            'Retirer la facture contestée pour obtenir un chiffre plus propre.',
            true,
          ),
        ],
      },
      renvoi: 'B2-02-A1-09-DIAPOSITIVE',
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A1-10-CORRECTION',
      titre: 'Correction : l’audit de la diapositive',
      sousTitre:
        'Un résumé se choisit après avoir regardé la série : ses extrêmes, son milieu, ses écarts.',
      dureeMinutes: 1,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        '1 min de mise en commun : faire lire à voix haute deux vérifications justes.',
        'Ne donner ni la médiane ni la moyenne exacte : ce sont les premières questions de l’atelier 1.',
        'Transition : jalon 1.',
      ),
    },
    'B2-02-A1-10-AUDIT-DIAPOSITIVE',
    [
      [
        'extreme',
        'La facture contestée pèse sur la moyenne : une seule valeur très grande suffit à la tirer vers le haut.',
      ],
      [
        'milieu',
        'Le délai qui partage les factures en deux moitiés se lit sur la série triée : c’est la médiane, calculée à l’atelier 1.',
      ],
      [
        'ecart',
        'Deux séries de même moyenne peuvent être régulières ou très dispersées : la banque demande aussi la régularité.',
      ],
      [
        'plafond',
        'Plusieurs factures dépassent 60 jours : une moyenne sous le plafond ne dit pas que chaque client le respecte.',
      ],
      [
        'retirer',
        'Retirer une facture parce qu’elle gêne, sans pièce qui prouve une erreur, fausse la série : piste fausse.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A1-11-JALON-1',
    titre: 'Jalon 1 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['serie-statistique'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la fiche A1-07 en 2 min sur la carte « Effectif ».',
      'Transition : « Acte 2 · Trouver le centre. Retour en 1835. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a1-jalon',
        invite:
          'Je sais décrire une série : population, caractère, effectif, unité et période.',
      },
    },
  },
];

const CONSIGNE_DE_L_ATELIER_1 =
  'Calculatrice autorisée. Délais de paiement des vingt factures du 2e trimestre 2026, dans l’ordre des factures F101 à F120 : 42 ; 25 ; 58 ; 31 ; 146 ; 38 ; 47 ; 18 ; 62 ; 44 ; 35 ; 52 ; 28 ; 75 ; 40 ; 30 ; 55 ; 34 ; 50 ; 45 (jours).';

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A2-01-QUETELET',
      titre: '1835 : Quetelet et l’homme moyen',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['moyenne'],
      notes: moteur.puces(
        'Raconter en 1 min : la moyenne devient un outil de gouvernement au XIXe siècle.',
        'Relance : « Un client moyen existe-t-il chez Atelier Rivage ? »',
        'Transition : « Calculons deux centres sur un petit exemple. »',
      ),
    },
    'image-left',
    {
      title: '1835 : Quetelet et l’homme moyen',
      subtitle:
        'L’astronome belge Adolphe Quetelet applique la moyenne aux sociétés humaines. Utile, et parfois trompeuse.',
      image: '/assets/cours/b2-02/v1/quetelet-1875.webp',
      imageAlt:
        'Portrait gravé d’Adolphe Quetelet, en buste, par Joseph-Arnold Demannez, publié en 1875 dans l’Annuaire de l’Académie royale de Belgique',
      paragraphs: [
        'En 1835, dans Sur l’homme et le développement de ses facultés, Quetelet décrit un « homme moyen » : la taille, le poids ou l’âge au mariage résumés par leur moyenne.',
        'L’idée fait école : les États se mettent à gouverner avec des moyennes. Mais aucun individu réel n’est l’homme moyen, et une moyenne ne dit rien de l’écart entre les individus.',
        'La moyenne est un bon outil quand les valeurs se ressemblent ; quand une valeur s’écarte beaucoup des autres, il faut un second centre, et une mesure de l’écart.',
      ],
      items: ['Un centre', 'Un écart', 'Une limite'],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Adolphe_Qu%C3%A9telet_by_Joseph-Arnold_Demannez.jpg',
        label:
          'Gravure de Joseph-Arnold Demannez, 1875 · Wikimedia Commons (domaine public)',
      },
    },
  ),
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A2-02-CORRECTION',
      titre: 'Correction : deux centres pour huit factures',
      dureeMinutes: 2,
      concepts: ['moyenne', 'mediane'],
      notes: moteur.puces(
        '« Corriger une étape de plus » : s’arrêter sur l’étape 2 (le tri) et l’étape 5 (la facture de 90 jours).',
        'Faire dire : la médiane se lit sur la série triée ; pour un effectif pair, c’est la demi-somme des deux valeurs du milieu.',
        'Transition : « À vous, sur les vingt factures : atelier 1. »',
      ),
    },
    {
      screenId: 'B2-02-A2-02-DEUX-CENTRES',
      titre: 'Deux centres pour huit factures',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['moyenne', 'mediane'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Pièges : prendre le milieu de la liste sans la trier ; retenir une seule des deux valeurs centrales.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-02-a2-deux-centres',
          enonce:
            'En septembre 2026, Atelier Rivage a encaissé huit factures professionnelles en 28, 41, 35, 90, 33, 39, 44 et 30 jours. Hélène veut un délai typique.',
          etapes: [
            {
              id: 'moyenne',
              intitule: 'La moyenne',
              raisonnement:
                'Somme des délais : 28 + 41 + 35 + 90 + 33 + 39 + 44 + 30 = 340 jours ; moyenne = 340 ÷ 8 = 42,5 jours.',
              invite: 'Quelle est la moyenne des huit délais ?',
            },
            {
              id: 'tri',
              intitule: 'Trier d’abord',
              raisonnement:
                'Série triée : 28 ; 30 ; 33 ; 35 ; 39 ; 41 ; 44 ; 90. Sans tri, les deux valeurs du milieu de la liste seraient 90 et 33, ce qui n’a aucun sens.',
              invite: 'Rangez les huit délais dans l’ordre croissant.',
            },
            {
              id: 'mediane',
              intitule: 'La médiane d’un effectif pair',
              raisonnement:
                'Huit valeurs : la médiane est la demi-somme des 4e et 5e valeurs triées, (35 + 39) ÷ 2 = 37 jours. Quatre factures sont payées en moins de 37 jours, quatre en plus.',
              invite:
                'Quel délai partage les huit factures en deux groupes de même effectif ?',
            },
            {
              id: 'ecart-des-centres',
              intitule: 'Pourquoi les deux centres diffèrent',
              raisonnement:
                'La facture de 90 jours tire la moyenne vers le haut ; la médiane ne dépend que du rang des valeurs du milieu.',
              invite:
                'Pourquoi la moyenne dépasse-t-elle nettement la médiane ?',
            },
            {
              id: 'sans-extreme',
              intitule: 'L’effet d’une valeur extrême',
              raisonnement:
                'Sans la facture de 90 jours : moyenne = 250 ÷ 7 ≈ 35,7 jours ; médiane = 35 jours (4e des sept valeurs). La moyenne perd près de 7 jours, la médiane 2.',
              invite:
                'Que deviennent la moyenne et la médiane si l’on retire la facture de 90 jours ?',
            },
            {
              id: 'effectifs',
              intitule: 'Moyenne avec des effectifs',
              raisonnement:
                'Si deux factures sont payées à 30 jours et six à 50 jours, la moyenne est (2 × 30 + 6 × 50) ÷ 8 = 45 jours, et non (30 + 50) ÷ 2 = 40 : chaque valeur compte autant de fois que son effectif.',
              invite:
                'Deux factures à 30 jours, six à 50 jours : quelle est la moyenne des délais ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-02-A2-03-ATELIER-1',
    titre: 'Atelier 1 — Le centre des vingt délais',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['mediane', 'moyenne'],
    notes: moteur.puces(
      '5 min de travail sur les questions 1 à 3 (annoncer « plus qu’une minute » à 4 min), puis 1 min de comparaison avec le voisin.',
      'Pièges : Q1 le milieu de la liste non triée (F110 et F111) ou une seule des deux valeurs centrales ; Q3 « la moitié des factures au-dessus de la moyenne ».',
      'Contrôle à faire dire : 20 × moyenne = 955 jours, la somme des délais.',
    ),
    proprietes: {
      renvoi: 'B2-02-A1-05-FACTURES',
      intitule: 'Atelier 1 — Le centre des vingt délais (questions 1 à 3)',
      consigne: CONSIGNE_DE_L_ATELIER_1,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a2-mediane',
          'mediane',
          'Quelle est la médiane des vingt délais de paiement ? Réponse en jours.',
          'jours',
          43,
          { type: 'absolue', valeur: 0.05 },
          '43',
          [
            [39.5, 'mediane-sans-tri'],
            [42, 'mediane-rang-pair'],
            [44, 'mediane-rang-pair'],
            [47.75, 'moyenne-lue-comme-mediane'],
          ],
        ),
        moteur.numerique(
          'b2-02-a2-moyenne',
          'moyenne',
          'Quelle est la moyenne des vingt délais de paiement ? Réponse en jours, arrondie au centième.',
          'jours',
          47.75,
          moteur.DEUX_DECIMALES,
          '47,75',
          [
            [42.578947, 'valeur-extreme-supprimee'],
            [43, 'moyenne-lue-comme-mediane'],
          ],
        ),
        moteur.vote(
          'b2-02-a2-au-dessus',
          'mediane',
          true,
          'Samir affirme : « la moitié de nos clients paient plus lentement que la moyenne ». Combien de factures ont un délai supérieur à la moyenne ?',
          'Moins de la moitié : 7 factures sur 20',
          [
            [
              'Exactement la moitié : 10 factures sur 20',
              'moyenne-lue-comme-mediane',
            ],
            ['Une seule : la facture F105', 'valeur-extreme-ignoree'],
          ],
          ['7 factures'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A2-03-CORRECTION-1',
      titre: 'Correction de l’atelier 1 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['mediane', 'moyenne'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie (score affiché sous chaque correction).',
        'Rapprocher Q2 et Q3 : la moyenne est tirée vers le haut par F105, donc seules sept factures la dépassent.',
        'Transition : « Trois questions de plus : la facture contestée, puis deux moyennes avec des effectifs. »',
      ),
    },
    'B2-02-A2-03-ATELIER-1',
    [
      [
        'b2-02-a2-mediane',
        'Série triée : 18 ; 25 ; 28 ; 30 ; 31 ; 34 ; 35 ; 38 ; 40 ; 42 ; 44 ; 45 ; … ; 146. Vingt valeurs : médiane = (10e + 11e) ÷ 2 = (42 + 44) ÷ 2 = 43 jours. Sans tri, le milieu de la liste (F110 et F111) donne 39,5, un nombre sans signification.',
      ],
      [
        'b2-02-a2-moyenne',
        'Somme des délais : 955 jours ; 955 ÷ 20 = 47,75 jours. Samir l’a arrondie à 48.',
      ],
      [
        'b2-02-a2-au-dessus',
        'Au-dessus de 47,75 jours : 50, 52, 55, 58, 62, 75 et 146, soit 7 factures sur 20. La moyenne ne partage pas la série en deux moitiés ; c’est le rôle de la médiane.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A2-03-ATELIER-1-SUITE',
    titre: 'Atelier 1 — Le centre des vingt délais (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['choix-du-resume', 'moyenne'],
    notes: moteur.puces(
      '5 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 à 3).',
      'Pièges : F105 retirée « pour faire propre » ; la moyenne simple des quatre salaires ; la moyenne des nombres de relances sans leurs effectifs.',
      'Contrôles à faire dire : les parts des catégories font 100 % ; les effectifs de relances font 20.',
    ),
    proprietes: {
      intitule: 'Atelier 1 — Le centre des vingt délais (questions 4 à 6)',
      consigne:
        'Calculatrice autorisée. Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.vote(
          'b2-02-a2-facture-contestee',
          'choix-du-resume',
          true,
          'La facture F105 (146 jours) est contestée par le client. Samir veut la retirer du fichier « pour avoir un chiffre propre ». Que faites-vous ?',
          'La garder, la signaler et donner un résumé qu’elle ne tire pas',
          [
            [
              'La retirer : une facture contestée n’est pas représentative',
              'valeur-extreme-supprimee',
            ],
            [
              'La garder sans rien dire : la moyenne suffit',
              'valeur-extreme-ignoree',
            ],
          ],
          ['signaler', 'résumé'],
        ),
        moteur.numerique(
          'b2-02-a2-salaire-moyen',
          'moyenne',
          'Insee, secteur privé, 2024 : salaire net mensuel moyen des cadres 4 629 € (23,0 % des postes), des professions intermédiaires 2 633 € (20,6 %), des employés 1 941 € (27,9 %), des ouvriers 2 051 € (28,6 %). Quel est le salaire net moyen de l’ensemble des postes ? Réponse en euros, arrondie à l’euro.',
          '€',
          2735.193,
          { type: 'absolue', valeur: 2 },
          '2 735',
          [[2813.5, 'moyenne-des-moyennes']],
        ),
        moteur.numerique(
          'b2-02-a2-relances',
          'moyenne',
          'Pour les vingt factures, le service comptable a compté les relances envoyées : 0 relance pour 9 factures, 1 relance pour 6, 2 pour 3, 3 pour 1 et 4 pour 1. Quel est le nombre moyen de relances par facture ? Réponse arrondie au centième.',
          null,
          0.95,
          moteur.DEUX_DECIMALES,
          '0,95',
          [
            [2, 'moyenne-des-moyennes'],
            [4, 'role-statistique-confondu'],
          ],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A2-03-CORRECTION-2',
      titre: 'Correction de l’atelier 1 : questions 4 à 6',
      dureeMinutes: 1,
      concepts: ['choix-du-resume', 'moyenne'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie ; à l’écran, elles sont numérotées 1 à 3.',
        'Salaires : l’Insee publie 2 733 € ; l’écart de 2 € vient de l’arrondi des parts. Faire dire pourquoi la moyenne simple surestime : les cadres, les mieux payés, ne sont que 23 % des postes.',
        'Transition : « Faites varier vous-même le délai de la facture contestée. »',
      ),
    },
    'B2-02-A2-03-ATELIER-1-SUITE',
    [
      [
        'b2-02-a2-facture-contestee',
        'Seule une pièce (un avoir, un jugement) prouverait que le délai est faux. On garde F105, on la signale, et l’on donne à la banque un résumé qu’une seule valeur ne tire pas : la médiane.',
      ],
      [
        'b2-02-a2-salaire-moyen',
        '4 629 × 0,230 + 2 633 × 0,206 + 1 941 × 0,279 + 2 051 × 0,286 ≈ 2 735 €. La moyenne simple des quatre salaires (2 813,50 €) traite chaque catégorie comme si elle avait le même effectif.',
      ],
      [
        'b2-02-a2-relances',
        '(0 × 9 + 1 × 6 + 2 × 3 + 3 × 1 + 4 × 1) ÷ 20 = 19 ÷ 20 = 0,95 relance par facture. Faire la moyenne de 0, 1, 2, 3 et 4 (soit 2) oublie les effectifs.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A2-04-FACTURE-LITIGE',
    titre: 'La facture contestée : qui bouge, qui résiste ?',
    diffusion: 'seance',
    brique: 'fp-concept4',
    dureeMinutes: 2,
    concepts: ['moyenne', 'mediane', 'choix-du-resume'],
    notes: moteur.puces(
      'Faire glisser le délai de F105 de 146 à 20 jours : la moyenne suit chaque jour, la médiane ne bouge pas tant que F105 reste au-dessus du milieu.',
      'Faire formuler : la médiane résiste aux valeurs extrêmes ; la moyenne en dépend.',
      'Transition : « Moyenne ou médiane : tout dépend de la question posée. »',
    ),
    proprietes: {
      id: 'b2-02-a2-facture-litige',
      parametres: [
        {
          cle: 'litige',
          libelle: 'Délai de la facture F105 (jours)',
          min: 20,
          max: 200,
          pas: 1,
          defaut: 146,
        },
      ],
      formuleLatexSimplifie: 'moyenne = somme des vingt délais ÷ 20',
      calcul: `MOYENNE(${serieAvecLitige()})`,
      etapes: [
        { libelle: 'Moyenne', calcul: `MOYENNE(${serieAvecLitige()})` },
        { libelle: 'Médiane', calcul: `MEDIANE(${serieAvecLitige()})` },
      ],
      prereglages: [
        { libelle: 'Délai contesté', valeurs: { litige: 146 } },
        { libelle: 'Payée au plafond légal', valeurs: { litige: 60 } },
        { libelle: 'Payée très vite', valeurs: { litige: 20 } },
      ],
      animation: [
        { litige: 146 },
        { litige: 200 },
        { litige: 100 },
        { litige: 60 },
        { litige: 20 },
      ],
      phrase:
        'Chaque jour de retard de F105 déplace la moyenne d’un vingtième de jour ; la médiane ne dépend que des deux valeurs du milieu de la série triée.',
    },
  },
  ...moteur.suiviDeSaCorrection(
    {
      screenId: 'B2-02-A2-05-CORRECTION',
      titre: 'Correction : moyenne ou médiane ?',
      sousTitre:
        'La moyenne sert quand on raisonne sur un total ; la médiane quand on cherche un individu typique ou une moitié, surtout si des valeurs extrêmes tirent la série.',
      dureeMinutes: 1,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        'Commencer par les deux cartes les plus ratées.',
        'Question clé pour chaque carte : « Raisonne-t-on sur un total, ou sur un individu typique ? »',
        'Transition : jalon 2.',
      ),
    },
    {
      screenId: 'B2-02-A2-05-MOYENNE-OU-MEDIANE',
      titre: 'Moyenne ou médiane : quel centre pour quelle question ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        'Binômes, 5 min de tri (annoncer la dernière minute), puis écran de correction.',
        'Cartes à risque : « prévoir l’encaissement total » (la moyenne, car total = effectif × moyenne) et « la moitié des factures » (la médiane).',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b2-02-a2-moyenne-ou-mediane',
            intitule:
              'Pour chaque question de gestion, choisissez le centre qui y répond le mieux.',
            dureeJeuMs: 300000,
          },
          'choix-du-resume',
          [
            ['moyenne', 'La moyenne'],
            ['mediane', 'La médiane'],
          ],
          [
            {
              id: 'encaissement',
              libelle:
                'Prévoir le nombre total de jours de crédit accordés sur les vingt prochaines factures',
              categorie: 'moyenne',
              confusion: 'moyenne-lue-comme-mediane',
              justification:
                'on raisonne sur un total : total = effectif × moyenne',
            },
            {
              id: 'client-typique',
              libelle:
                'Donner à la banque le délai d’un client typique quand une facture est contestée',
              categorie: 'mediane',
              confusion: 'valeur-extreme-ignoree',
              justification:
                'la facture contestée tire la moyenne ; la médiane lui résiste',
            },
            {
              id: 'salaire-ordinaire',
              libelle:
                'Décrire le salaire d’un salarié ordinaire du secteur privé',
              categorie: 'mediane',
              confusion: 'valeur-extreme-ignoree',
              justification:
                'quelques très hauts salaires tirent la moyenne au-dessus du salaire ordinaire',
            },
            {
              id: 'relances',
              libelle:
                'Budgéter le coût annuel des relances à partir du nombre de relances par facture',
              categorie: 'moyenne',
              confusion: 'moyenne-lue-comme-mediane',
              justification:
                'un budget est un total : nombre moyen de relances × nombre de factures × coût',
            },
            {
              id: 'local',
              libelle:
                'Estimer le prix au m² d’un local commercial ordinaire avant d’en louer un',
              categorie: 'mediane',
              confusion: 'valeur-extreme-ignoree',
              justification:
                'quelques locaux de prestige tirent la moyenne loin du local ordinaire',
            },
            {
              id: 'compensation',
              libelle:
                'Calculer la note qui compense les épreuves du BTS avec leurs coefficients',
              categorie: 'moyenne',
              confusion: 'moyenne-lue-comme-mediane',
              justification:
                'la compensation est une moyenne pondérée par les coefficients',
            },
            {
              id: 'moitie',
              libelle:
                'Dire en combien de jours la moitié des factures est encaissée',
              categorie: 'mediane',
              confusion: 'moyenne-lue-comme-mediane',
              justification:
                'la médiane partage la série en deux moitiés de même effectif',
            },
            {
              id: 'stock',
              libelle:
                'Calculer la rotation du stock de toile à partir du stock de chaque mois',
              categorie: 'moyenne',
              confusion: 'moyenne-lue-comme-mediane',
              justification:
                'la rotation rapporte les sorties de l’année au stock moyen, un total divisé par douze',
            },
          ],
        ),
      },
    },
  ),
  {
    screenId: 'B2-02-A2-06-JALON-2',
    titre: 'Jalon 2 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['moyenne', 'mediane'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : refaire au tableau l’étape « La médiane d’un effectif pair » de A2-02.',
      'Transition : « Acte 3 : deux segments de clients, une même moyenne. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a2-jalon',
        invite:
          'Je sais calculer une moyenne, une médiane, et choisir entre les deux.',
      },
    },
  },
];

const CONSIGNE_DE_L_ATELIER_2 =
  'Calculatrice autorisée. Convention du cours : pour n valeurs triées, Q1 est la valeur de rang ⌈n ÷ 4⌉ et Q3 celle de rang ⌈3n ÷ 4⌉ (arrondis à l’entier supérieur). Délais des vingt factures, triés : 18 ; 25 ; 28 ; 30 ; 31 ; 34 ; 35 ; 38 ; 40 ; 42 ; 44 ; 45 ; 47 ; 50 ; 52 ; 55 ; 58 ; 62 ; 75 ; 146.';

const ACTE_3: moteur.Acte = [
  {
    screenId: 'B2-02-A3-01-VOTE-SEGMENTS',
    titre: 'Vote : même moyenne, même clientèle ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['dispersion'],
    notes: moteur.puces(
      'Vote 1 individuel, sans calculatrice.',
      'Entre 30 et 70 % de bonnes réponses : débat en binôme « convainquez votre voisin », puis revote ; sinon, revote directement.',
      'Pièges : « même moyenne, même comportement » ; « même étendue, même dispersion ».',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-02-a3-segments-v1',
          'dispersion',
          true,
          'Les clubs nautiques ont payé en 40, 42, 44, 45, 46, 48 et 50 jours ; les chantiers navals en 15, 20, 30, 45, 60, 70 et 75 jours. Les deux segments ont la même moyenne et la même médiane, 45 jours. Pour prévoir la trésorerie, les deux segments se valent-ils ?',
          'Non : les délais des chantiers s’écartent bien davantage de 45 jours',
          [
            [
              'Oui : même moyenne, donc même comportement de paiement',
              'meme-moyenne-meme-serie',
            ],
            [
              'Oui : même médiane, donc les mêmes délais',
              'meme-moyenne-meme-serie',
            ],
          ],
          ['chantiers', 'écartent'],
        ),
        moteur.vote(
          'b2-02-a3-segments-v2',
          'dispersion',
          true,
          'Deux fournisseurs livrent avec ces retards, en jours : A : 10, 50, 50, 50, 90 ; B : 10, 20, 50, 80, 90. Les deux séries ont la même moyenne et la même étendue. Laquelle est la plus dispersée ?',
          'La série B : ses valeurs s’éloignent davantage de la moyenne',
          [
            [
              'Aucune : même étendue, donc même dispersion',
              'etendue-prise-pour-dispersion',
            ],
            [
              'La série A : elle contient les deux valeurs extrêmes',
              'etendue-prise-pour-dispersion',
            ],
          ],
          ['série B', 'éloignent'],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Un centre ne suffit pas : il faut mesurer l’écart',
        lignes: [
          'Clubs : tous les délais entre 40 et 50 jours. Chantiers : de 15 à 75 jours. Même centre, régularité opposée.',
          'L’étendue (maximum − minimum) ne regarde que deux valeurs : A et B ont la même, 80 jours.',
          'Écarts à la moyenne : A s’écarte de 40, 0, 0, 0 et 40 jours ; B de 40, 30, 0, 30 et 40. B est plus dispersée.',
        ],
      },
    },
  },
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A3-02-CORRECTION',
      titre: 'Correction : mesurer l’écart des deux segments',
      dureeMinutes: 2,
      concepts: ['quartiles', 'ecart-type'],
      notes: moteur.puces(
        '« Corriger une étape de plus » : vite sur l’étendue, s’arrêter sur les quartiles (étape 2) et sur la racine (étape 5).',
        'Faire dire : l’écart-type est « l’écart moyen » à la moyenne, dans l’unité de la série ; la variance est son carré.',
        'Transition : « Le tableur a deux fonctions d’écart-type. Laquelle choisir ? »',
      ),
    },
    {
      screenId: 'B2-02-A3-02-DISPERSION',
      titre: 'Mesurer l’écart des deux segments',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['quartiles', 'ecart-type'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Pièges : prendre la moitié de la médiane pour Q1 ; oublier la racine carrée (donner la variance).',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: 'B2-02-A3-01-VOTE-SEGMENTS',
        exemple: {
          id: 'b2-02-a3-dispersion',
          enonce:
            'Clubs nautiques : 40, 42, 44, 45, 46, 48, 50 jours. Chantiers navals : 15, 20, 30, 45, 60, 70, 75 jours. Moyenne et médiane : 45 jours dans les deux cas. La banque veut savoir quel segment paie le plus régulièrement.',
          etapes: [
            {
              id: 'etendue',
              intitule: 'L’étendue',
              raisonnement:
                'Étendue = maximum − minimum : clubs 50 − 40 = 10 jours ; chantiers 75 − 15 = 60 jours. Elle ne dépend que de deux valeurs.',
              invite: 'Quelle est l’étendue des délais de chaque segment ?',
            },
            {
              id: 'quartiles',
              intitule: 'Les quartiles',
              raisonnement:
                'Sept valeurs triées : Q1 est la 2e valeur (7 ÷ 4 = 1,75, arrondi à 2), Q3 la 6e (3 × 7 ÷ 4 = 5,25, arrondi à 6). Clubs : Q1 = 42, Q3 = 48. Chantiers : Q1 = 20, Q3 = 70. Au moins un quart des valeurs est inférieur ou égal à Q1, au moins trois quarts à Q3.',
              invite:
                'Quels sont le premier et le troisième quartile de chaque segment ?',
            },
            {
              id: 'ecart-interquartile',
              intitule: 'L’écart interquartile',
              raisonnement:
                'EIQ = Q3 − Q1 : clubs 6 jours ; chantiers 50 jours. La moitié centrale des délais tient dans 6 jours chez les clubs, dans 50 jours chez les chantiers.',
              invite: 'Quel est l’écart interquartile de chaque segment ?',
            },
            {
              id: 'variance',
              intitule: 'La variance des clubs',
              raisonnement:
                'Écarts à 45 : −5 ; −3 ; −1 ; 0 ; 1 ; 3 ; 5. Carrés : 25 ; 9 ; 1 ; 0 ; 1 ; 9 ; 25, de somme 70. Variance = 70 ÷ 7 = 10 jours².',
              invite:
                'Quelle est la moyenne des carrés des écarts à la moyenne, pour les clubs ?',
            },
            {
              id: 'ecart-type',
              intitule: 'L’écart-type',
              raisonnement:
                'Écart-type = √variance : clubs √10 ≈ 3,16 jours. Chantiers : carrés des écarts 900 ; 625 ; 225 ; 0 ; 225 ; 625 ; 900, variance 3 500 ÷ 7 = 500 jours², écart-type √500 ≈ 22,36 jours. La variance est en jours², l’écart-type revient en jours.',
              invite:
                'Quel est l’écart-type de chaque segment, et dans quelle unité ?',
            },
            {
              id: 'phrase',
              intitule: 'La phrase pour la banque',
              raisonnement:
                '« Les deux segments paient en 45 jours en moyenne, mais les chantiers s’en écartent de 22 jours environ, contre 3 pour les clubs : leurs encaissements sont bien moins prévisibles. »',
              invite:
                'Quelle phrase écrivez-vous à la banque pour comparer les deux segments ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A3-03-DEUX-ECARTS-TYPES',
      titre: 'Deux fonctions d’écart-type : laquelle choisir ?',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['ecart-type'],
      notes: moteur.puces(
        'Faire lire les deux colonnes ; question : « Les vingt factures du trimestre sont-elles toute la population étudiée, ou un échantillon ? »',
        'Réponse à faire dire : toute la population du trimestre, donc ECARTYPEP. Si l’on estimait tous les clients à partir de quelques factures tirées au hasard, ECARTYPE.',
        'Transition : « Atelier 2 : l’écart des vingt délais. »',
      ),
    },
    'comparison',
    {
      title: 'Deux fonctions d’écart-type : laquelle choisir ?',
      subtitle:
        'Le tableur propose deux écarts-types. Ils ne diffèrent que par le nombre qui divise la somme des carrés des écarts.',
      columns: [
        {
          label: 'ECARTYPEP : la population entière',
          tone: 'success',
          items: [
            'On divise la somme des carrés des écarts par n.',
            'On a observé tous les individus étudiés : les vingt factures du trimestre.',
            'C’est la définition du programme de BTS.',
          ],
        },
        {
          label: 'ECARTYPE : un échantillon',
          tone: 'info',
          items: [
            'On divise par n − 1 : le résultat est un peu plus grand.',
            'On estime l’écart d’une population plus vaste à partir de quelques individus tirés au hasard.',
            'L’écart entre les deux fonctions diminue quand n grandit.',
          ],
        },
        {
          label: 'La variance',
          tone: 'warning',
          items: [
            'C’est le carré de l’écart-type, en unité au carré (jours²).',
            'Elle sert au calcul, pas à la phrase : on ne dit jamais « un écart de 500 jours² ».',
          ],
        },
      ],
      note: 'Excel : ECARTYPE.PEARSON et ECARTYPE.STANDARD. LibreOffice Calc : ECARTYPEP et ECARTYPE.',
    },
  ),
  {
    screenId: 'B2-02-A3-04-ATELIER-2',
    titre: 'Atelier 2 — L’écart des délais',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['quartiles', 'ecart-type'],
    notes: moteur.puces(
      '5 min de travail sur les questions 1 à 3, puis 1 min avec le voisin.',
      'Pièges : Q1 l’étendue au lieu de l’écart interquartile, ou les quartiles pris à la moitié de la médiane ; Q2 la variance ou la division par n − 1.',
    ),
    proprietes: {
      renvoi: 'B2-02-A1-05-FACTURES',
      intitule: 'Atelier 2 — L’écart des délais (questions 1 à 3)',
      consigne: CONSIGNE_DE_L_ATELIER_2,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a3-eiq',
          'quartiles',
          'Avec la convention du cours, quel est l’écart interquartile des vingt délais ? Réponse en jours.',
          'jours',
          21,
          { type: 'absolue', valeur: 0.05 },
          '21',
          [
            [128, 'etendue-prise-pour-dispersion'],
            [19.5, 'convention-de-quartile-ignoree'],
            [43, 'quartile-moitie-de-mediane'],
          ],
        ),
        moteur.numerique(
          'b2-02-a3-ecart-type-cinq',
          'ecart-type',
          'Cinq clients, les seuls de leur segment, ont payé en 30, 40, 50, 60 et 70 jours. Quel est l’écart-type de leurs délais ? Réponse en jours, arrondie au centième.',
          'jours',
          14.142136,
          moteur.DEUX_DECIMALES,
          '14,14',
          [
            [15.811388, 'ecart-type-population-echantillon'],
            [200, 'variance-confondue-avec-ecart-type'],
          ],
        ),
        moteur.vote(
          'b2-02-a3-variance',
          'ecart-type',
          true,
          'Pour les vingt délais, le tableur affiche 686,49 dans la cellule « Variance ». Samir écrit : « nos délais s’écartent de 686 jours en moyenne ». Que lui répondez-vous ?',
          'Faux : 686,49 est en jours², l’écart-type en est la racine carrée',
          [
            [
              'Juste : la variance mesure l’écart moyen',
              'variance-confondue-avec-ecart-type',
            ],
            [
              'Faux : il faut diviser 686,49 par 20',
              'variance-confondue-avec-ecart-type',
            ],
          ],
          ['jours²', 'racine'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A3-04-CORRECTION-1',
      titre: 'Correction de l’atelier 2 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['quartiles', 'ecart-type'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie.',
        'Écart interquartile : faire comparer à l’étendue, gonflée par la seule facture F105.',
        'Transition : « Deux questions de plus : quelle fonction du tableur, et un échantillon. »',
      ),
    },
    'B2-02-A3-04-ATELIER-2',
    [
      [
        'b2-02-a3-eiq',
        'n = 20 : Q1 est la 5e valeur triée, 31 jours ; Q3 la 15e, 52 jours. EIQ = 52 − 31 = 21 jours. L’étendue (146 − 18 = 128 jours) ne dépend que de deux factures, dont la contestée.',
      ],
      [
        'b2-02-a3-ecart-type-cinq',
        'Moyenne 50 ; carrés des écarts 400, 100, 0, 100, 400, de somme 1 000 ; variance 1 000 ÷ 5 = 200 jours² ; écart-type √200 ≈ 14,14 jours. Les cinq clients forment tout le segment : on divise par n.',
      ],
      [
        'b2-02-a3-variance',
        'La variance s’exprime en jours² : l’écart-type vaut √686,49 ≈ 26,2 jours. Écrire « 686 jours » confond le carré et l’écart.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A3-04-ATELIER-2-SUITE',
    titre: 'Atelier 2 — L’écart des délais (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['ecart-type'],
    notes: moteur.puces(
      '4 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 et 2).',
      'Pièges : ECARTYPE « parce que c’est la fonction standard » ; diviser par n pour un échantillon.',
    ),
    proprietes: {
      intitule: 'Atelier 2 — L’écart des délais (questions 4 et 5)',
      consigne:
        'Calculatrice autorisée. Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.vote(
          'b2-02-a3-fonction',
          'ecart-type',
          true,
          'Hélène veut l’écart-type des délais des factures du 2e trimestre 2026, toutes présentes dans le fichier. Quelle fonction du tableur choisissez-vous ?',
          'ECARTYPEP : le fichier contient toute la population étudiée',
          [
            [
              'ECARTYPE : c’est la fonction proposée par défaut',
              'ecart-type-population-echantillon',
            ],
            [
              'VAR : la variance suffit à la banque',
              'variance-confondue-avec-ecart-type',
            ],
          ],
        ),
        moteur.numerique(
          'b2-02-a3-ecart-type-echantillon',
          'ecart-type',
          'Pour estimer l’écart-type des délais de ses 300 clients, la banque tire cinq factures au hasard : 30, 40, 50, 60 et 70 jours. Quelle estimation donne la division par n − 1 ? Réponse en jours, arrondie au centième.',
          'jours',
          15.811388,
          moteur.DEUX_DECIMALES,
          '15,81',
          [
            [14.142136, 'ecart-type-population-echantillon'],
            [250, 'variance-confondue-avec-ecart-type'],
          ],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A3-04-CORRECTION-2',
      titre: 'Correction de l’atelier 2 : questions 4 et 5',
      dureeMinutes: 1,
      concepts: ['ecart-type'],
      notes: moteur.puces(
        'Faire formuler la règle : toute la population observée, division par n ; un échantillon pour estimer, division par n − 1.',
        'Transition : jalon 3.',
      ),
    },
    'B2-02-A3-04-ATELIER-2-SUITE',
    [
      [
        'b2-02-a3-fonction',
        'Le fichier contient toutes les factures du trimestre : c’est la population étudiée, on divise par n (ECARTYPEP). ECARTYPE estime l’écart d’une population plus vaste à partir d’un échantillon.',
      ],
      [
        'b2-02-a3-ecart-type-echantillon',
        'Même somme des carrés, 1 000, mais divisée par n − 1 = 4 : 250 jours² ; √250 ≈ 15,81 jours. L’estimation est un peu plus grande que l’écart-type des cinq valeurs.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A3-05-JALON-3',
    titre: 'Jalon 3 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['dispersion', 'quartiles', 'ecart-type'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : refaire l’étape « Les quartiles » de A3-02 sur les vingt délais.',
      'Annoncer la pause de 15 min ; au retour, acte 4 au tableur.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a3-jalon',
        invite:
          'Je sais mesurer l’écart d’une série : étendue, écart interquartile et écart-type.',
      },
    },
  },
];

const LIGNE_DE_TETE = 1;
const PREMIERE_LIGNE_DE_DONNEES = LIGNE_DE_TETE + 1;
const DERNIERE_LIGNE_DE_DONNEES = LIGNE_DE_TETE + DELAIS_DU_TRIMESTRE.length;
const PLAGE_DES_DELAIS = `B${PREMIERE_LIGNE_DE_DONNEES}:B${DERNIERE_LIGNE_DE_DONNEES}`;

function cellulesDesFactures(): Record<string, string> {
  return Object.fromEntries(
    DELAIS_DU_TRIMESTRE.flatMap((delai, rang) => {
      const ligne = PREMIERE_LIGNE_DE_DONNEES + rang;
      return [
        [`A${ligne}`, numeroDeFacture(rang)],
        [`B${ligne}`, String(delai)],
      ];
    }),
  );
}

const REFERENCES_DES_FACTURES = DELAIS_DU_TRIMESTRE.flatMap((_, rang) => {
  const ligne = PREMIERE_LIGNE_DE_DONNEES + rang;
  return [`A${ligne}`, `B${ligne}`];
});

const INDICATEURS_DE_LA_FEUILLE = [
  ['D2', 'Effectif'],
  ['D3', 'Moyenne'],
  ['D4', 'Médiane'],
  ['D5', 'Q1 (tableur)'],
  ['D6', 'Q3 (tableur)'],
  ['D7', 'Écart interquartile (tableur)'],
  ['D8', 'Étendue'],
  ['D9', 'Écart-type (population)'],
  ['D10', 'Contrôle : effectif × moyenne = somme'],
] as const;

const PLAN_FEUILLE = {
  id: 'b2-02-a4-feuille-delais',
  intitule: 'Tâche de tableur — Résumer les vingt délais',
  lignes: DERNIERE_LIGNE_DE_DONNEES,
  colonnes: 5,
  cellules: {
    A1: 'Facture',
    B1: 'Délai (jours)',
    D1: 'Indicateur',
    E1: 'Valeur',
    ...cellulesDesFactures(),
    ...Object.fromEntries(INDICATEURS_DE_LA_FEUILLE),
  },
  verrouillees: [
    'A1',
    'B1',
    'D1',
    'E1',
    ...REFERENCES_DES_FACTURES,
    ...INDICATEURS_DE_LA_FEUILLE.map(([reference]) => reference),
  ],
  consignes: [
    `En E2, comptez les délais avec NB(${PLAGE_DES_DELAIS}).`,
    'En E3 et E4, calculez la moyenne et la médiane avec MOYENNE et MEDIANE.',
    'En E5 et E6, calculez les quartiles avec QUARTILE(plage;1) et QUARTILE(plage;3), puis leur écart en E7. Comparez aux quartiles du cours : le tableur interpole entre deux valeurs.',
    'En E8, calculez l’étendue avec MAX et MIN.',
    'En E9, calculez l’écart-type de la population avec ECARTYPEP.',
    'En E10, contrôlez vos formules : =SI(ARRONDI(E2*E3-SOMME(plage);6)=0;1;0) doit afficher 1.',
  ],
};

const CONSIGNE_DE_L_ATELIER_3 =
  'Banque de France, entreprises hors microentreprises : délais de paiement aux fournisseurs, en jours d’achats. Dans cette boîte, les moustaches vont du 10e au 90e centile. 2023 : 31,0 ; 42,8 ; 57,3 ; 75,6 ; 99,8. 2024 : 29,9 ; 41,7 ; 56,2 ; 75,0 ; 100,4 (10e centile, 1er quartile, médiane, 3e quartile, 90e centile).';

const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-01-GALTON',
      titre: 'De Galton à Tukey : résumer par des rangs',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['quartiles', 'boite-a-moustaches'],
      notes: moteur.puces(
        'Raconter en 1 min : médiane et quartiles naissent pour résister aux valeurs extrêmes.',
        'Relance : « Combien de nombres faut-il pour dessiner une boîte ? » (cinq).',
        'Transition : « Faisons calculer ces nombres par le tableur. »',
      ),
    },
    'image-left',
    {
      title: 'De Galton à Tukey : résumer par des rangs',
      subtitle:
        'Médiane et quartiles se lisent sur la série triée ; ils résistent aux valeurs extrêmes.',
      image: '/assets/cours/b2-02/v1/galton-1890.webp',
      imageAlt:
        'Photographie de Sir Francis Galton vers 1890, homme âgé aux favoris blancs, en costume sombre, portrait de trois quarts',
      paragraphs: [
        'Dans les années 1870 et 1880, le savant anglais Francis Galton résume ses mesures par la médiane et les quartiles, qu’il lit directement sur les valeurs rangées, plutôt que par la seule moyenne.',
        'En 1977, dans Exploratory Data Analysis, le statisticien américain John Tukey popularise la boîte à moustaches : cinq nombres (minimum, premier quartile, médiane, troisième quartile, maximum) suffisent à dessiner une série et à la comparer à une autre.',
        'Attention aux conventions : le programme, les tableurs et la Banque de France ne calculent pas tous les quartiles de la même façon, et les moustaches ne vont pas toujours du minimum au maximum.',
      ],
      items: ['Minimum', 'Q1', 'Médiane', 'Q3', 'Maximum'],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Sir_Francis_Galton,_circa_1890.jpg',
        label:
          'Graham’s Art Studios, vers 1890 · Wikimedia Commons (domaine public)',
      },
    },
  ),
  {
    screenId: 'B2-02-A4-02-FEUILLE-DELAIS',
    titre: 'Tâche de tableur — Résumer les vingt délais',
    diffusion: 'seance',
    brique: 'fp-sheet',
    dureeMinutes: 15,
    concepts: ['moyenne', 'mediane', 'quartiles', 'ecart-type'],
    notes: moteur.puces(
      'Binômes ; circuler. À 10 min, projeter la grille d’un binôme volontaire.',
      'Erreurs à chercher : ECARTYPE au lieu de ECARTYPEP ; étendue tapée à la main ; quartiles du tableur recopiés comme ceux du cours.',
      'Faire comparer E5 et E6 aux quartiles de l’atelier 2 : le tableur interpole, le cours prend une valeur de la série.',
    ),
    proprietes: {
      modalite: 'binome',
      plan: PLAN_FEUILLE,
      questions: [
        {
          type: 'feuille',
          id: 'b2-02-a4-feuille-delais',
          concept: 'ecart-type',
          noteCompte: true,
          corrige: {
            type: 'feuille',
            plan: PLAN_FEUILLE,
            attendus: [
              moteur.attendu(
                'E2',
                `=NB(${PLAGE_DES_DELAIS})`,
                20,
                'references',
                [],
                null,
                moteur.TOLERANCE_NULLE,
              ),
              moteur.attendu(
                'E3',
                `=MOYENNE(${PLAGE_DES_DELAIS})`,
                47.75,
                'references',
                [[43, 'moyenne-lue-comme-mediane']],
              ),
              moteur.attendu(
                'E4',
                `=MEDIANE(${PLAGE_DES_DELAIS})`,
                43,
                'references',
                [
                  [47.75, 'moyenne-lue-comme-mediane'],
                  [39.5, 'mediane-sans-tri'],
                ],
              ),
              moteur.attendu(
                'E5',
                `=QUARTILE(${PLAGE_DES_DELAIS};1)`,
                33.25,
                'references',
                [[21.5, 'quartile-moitie-de-mediane']],
              ),
              moteur.attendu(
                'E6',
                `=QUARTILE(${PLAGE_DES_DELAIS};3)`,
                52.75,
                'references',
              ),
              moteur.attendu('E7', '=E6-E5', 19.5, 'references', [
                [128, 'etendue-prise-pour-dispersion'],
              ]),
              moteur.attendu(
                'E8',
                `=MAX(${PLAGE_DES_DELAIS})-MIN(${PLAGE_DES_DELAIS})`,
                128,
                'references',
              ),
              moteur.attendu(
                'E9',
                `=ECARTYPEP(${PLAGE_DES_DELAIS})`,
                26.200906,
                'references',
                [
                  [26.881563, 'ecart-type-population-echantillon'],
                  [686.4875, 'variance-confondue-avec-ecart-type'],
                ],
              ),
              moteur.controle(
                'E10',
                `=SI(ARRONDI(E2*E3-SOMME(${PLAGE_DES_DELAIS});6)=0;1;0)`,
              ),
            ],
            seuilReussite: 0.8,
          },
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-03-BOITE-DELAIS',
      titre: 'La boîte à moustaches des vingt délais',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['boite-a-moustaches', 'quartiles'],
      notes: moteur.puces(
        'Faire lire les cinq nombres de la première boîte, puis comparer à la seconde, sans F105.',
        'Relance : « Qu’est-ce qui change quand on retire F105 ? » (la moustache droite et la moyenne ; la boîte presque pas).',
        'Transition : « Même lecture sur une vraie série : les délais des entreprises françaises. »',
      ),
    },
    'boxplot',
    {
      title: 'Délais de paiement des factures du 2e trimestre 2026',
      subtitle:
        'Quartiles selon la convention du cours ; losange : la moyenne.',
      unit: 'jours',
      axisRange: [0, 160],
      series: [
        {
          label: 'Les vingt factures',
          min: 18,
          q1: 31,
          median: 43,
          q3: 52,
          max: 146,
          mean: 47.75,
          tone: 'gold',
        },
        {
          label: 'Sans la facture F105',
          min: 18,
          q1: 31,
          median: 42,
          q3: 52,
          max: 75,
          mean: 42.58,
          tone: 'teal',
        },
      ],
      reading:
        'La moitié centrale des délais va de 31 à 52 jours ; la moustache droite s’étire jusqu’à 146 jours à cause de la seule facture contestée.',
      source: 'Journal des ventes d’Atelier Rivage (données fictives).',
      description:
        'Deux boîtes à moustaches horizontales sur un axe de 0 à 160 jours. Vingt factures : minimum 18, premier quartile 31, médiane 43, troisième quartile 52, maximum 146, moyenne 47,75. Sans F105 : minimum 18, premier quartile 31, médiane 42, troisième quartile 52, maximum 75, moyenne 42,58.',
    },
    { renvoi: 'B2-02-A4-02-FEUILLE-DELAIS' },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-04-BDF',
      titre: 'Délais fournisseurs des entreprises françaises, 2023 et 2024',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['boite-a-moustaches'],
      notes: moteur.puces(
        'Préciser la convention : ici, les moustaches s’arrêtent au 10e et au 90e centile, pas au minimum et au maximum.',
        'Faire lire la médiane et les deux quartiles de 2024 sans commenter.',
        'Transition : « Atelier 3 : lire ces deux boîtes. »',
      ),
    },
    'boxplot',
    {
      title: 'Délais de paiement aux fournisseurs, 2023 et 2024',
      subtitle:
        'Entreprises françaises hors microentreprises ; moustaches du 10e au 90e centile.',
      unit: 'jours d’achats',
      axisRange: [0, 120],
      series: [
        {
          label: '2023',
          min: 31,
          q1: 42.8,
          median: 57.3,
          q3: 75.6,
          max: 99.8,
          tone: 'ink',
        },
        {
          label: '2024',
          min: 29.9,
          q1: 41.7,
          median: 56.2,
          q3: 75,
          max: 100.4,
          tone: 'teal',
        },
      ],
      source:
        'Banque de France, Bulletin n° 260/5, « Les délais de paiement se sont réduits en 2024 », octobre 2025, encadré 2 (base Fiben).',
      description:
        'Deux boîtes à moustaches horizontales sur un axe de 0 à 120 jours. 2023 : 10e centile 31,0, premier quartile 42,8, médiane 57,3, troisième quartile 75,6, 90e centile 99,8. 2024 : 10e centile 29,9, premier quartile 41,7, médiane 56,2, troisième quartile 75,0, 90e centile 100,4.',
    },
  ),
  {
    screenId: 'B2-02-A4-05-ATELIER-3',
    titre: 'Atelier 3 — Lire une boîte à moustaches',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 7,
    concepts: ['boite-a-moustaches', 'quartiles'],
    notes: moteur.puces(
      '6 min de travail, puis 1 min de comparaison avec le voisin.',
      'Pièges : Q1 « plus de la moitié dans la partie la plus longue » ; Q2 l’écart entre les deux moustaches ; Q3 « plus d’entreprises entre la médiane et Q3 ».',
    ),
    proprietes: {
      renvoi: 'B2-02-A4-04-BDF',
      intitule: 'Atelier 3 — Lire une boîte à moustaches',
      consigne: CONSIGNE_DE_L_ATELIER_3,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.vote(
          'b2-02-a4-part-boite',
          'boite-a-moustaches',
          true,
          'En 2024, quelle part des entreprises paie ses fournisseurs dans un délai compris entre le premier et le troisième quartile ?',
          'Environ la moitié des entreprises',
          [
            ['Environ un quart des entreprises', 'quartile-moitie-de-mediane'],
            [
              'Plus de la moitié : c’est la partie la plus large du graphique',
              'boite-lue-comme-effectif',
            ],
          ],
        ),
        moteur.numerique(
          'b2-02-a4-eiq-2024',
          'quartiles',
          'Quel est l’écart interquartile des délais fournisseurs en 2024 ? Réponse en jours, arrondie au dixième.',
          'jours',
          33.3,
          { type: 'absolue', valeur: 0.05 },
          '33,3',
          [
            [70.5, 'etendue-prise-pour-dispersion'],
            [18.8, 'quartile-moitie-de-mediane'],
          ],
        ),
        moteur.vote(
          'b2-02-a4-asymetrie',
          'boite-a-moustaches',
          true,
          'En 2024, la partie de la boîte entre la médiane et Q3 mesure 18,8 jours ; celle entre Q1 et la médiane, 14,5 jours. Qu’en concluez-vous ?',
          'Au-dessus de la médiane, les délais sont plus étalés, pour un même quart des entreprises',
          [
            [
              'Il y a davantage d’entreprises entre la médiane et Q3',
              'boite-lue-comme-effectif',
            ],
            [
              'Les délais au-dessus de la médiane sont plus réguliers',
              'boite-lue-comme-effectif',
            ],
          ],
          ['étalés', 'même quart'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A4-05-CORRECTION',
      titre: 'Correction de l’atelier 3 : lire une boîte',
      dureeMinutes: 1,
      concepts: ['boite-a-moustaches', 'quartiles'],
      notes: moteur.puces(
        'Point clé : chaque partie de la boîte contient le même quart des entreprises ; sa longueur dit l’étalement, pas l’effectif.',
        'Faire lire la comparaison 2023-2024 : la boîte bouge peu, le 90e centile monte.',
        'Transition : « Écrivez la phrase de lecture de votre boîte pour la banque. »',
      ),
    },
    'B2-02-A4-05-ATELIER-3',
    [
      [
        'b2-02-a4-part-boite',
        'Entre Q1 et Q3 se trouve la moitié des entreprises : un quart entre Q1 et la médiane, un quart entre la médiane et Q3. La largeur d’une partie ne dit rien de son effectif.',
      ],
      [
        'b2-02-a4-eiq-2024',
        'EIQ = Q3 − Q1 = 75,0 − 41,7 = 33,3 jours. L’écart entre les moustaches (100,4 − 29,9 = 70,5 jours) couvre 80 % des entreprises, pas la moitié centrale.',
      ],
      [
        'b2-02-a4-asymetrie',
        'Chaque partie contient un quart des entreprises ; la plus longue indique des délais plus étalés. La série est étirée vers les délais longs.',
      ],
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-06-LECTURE',
      titre: 'La phrase de lecture pour la banque',
      diffusion: 'seance',
      dureeMinutes: 3,
      concepts: ['boite-a-moustaches'],
      notes: moteur.puces(
        '2 min d’écriture, puis lire deux réponses.',
        'Exiger les deux quartiles et la médiane avec leur unité, et une mention de F105.',
        'Transition : jalon 4.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-02-a4-lecture',
        type: 'reflection',
        question:
          'En deux phrases, décrivez à la banque la boîte à moustaches des vingt délais d’Atelier Rivage : où se situe la moitié centrale des factures, et que montre la moustache droite ?',
        placeholder: 'La moitié des factures… La moustache droite…',
        competency: 'Communiquer · lire une boîte à moustaches',
      },
    },
    {
      correction: {
        expected:
          'La moitié centrale des factures est encaissée entre 31 et 52 jours, et la moitié des factures l’est en 43 jours au plus. La moustache droite s’étire jusqu’à 146 jours à cause d’une seule facture, contestée par le client.',
        nextAction:
          'Vérifiez que vos phrases citent les quartiles et la médiane avec leur unité, et nomment la valeur extrême.',
      },
      renvoi: 'B2-02-A4-03-BOITE-DELAIS',
    },
  ),
  {
    screenId: 'B2-02-A4-07-JALON-4',
    titre: 'Jalon 4 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['boite-a-moustaches'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la correction de l’atelier 3, question 1.',
      'Transition : « Acte 5 : quand les valeurs arrivent en classes. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a4-jalon',
        invite:
          'Je sais calculer les indicateurs au tableur et lire une boîte à moustaches.',
      },
    },
  },
];

const CLASSES_DE_DELAIS = [
  '[0 ; 30[',
  '[30 ; 45[',
  '[45 ; 60[',
  '[60 ; 90[',
  '[90 ; 150[',
] as const;

const PLAN_TABLEAU = {
  id: 'b2-02-a5-effectifs-cumules',
  intitule: 'Tableau des effectifs cumulés des vingt délais',
  consignes: [
    'Les vingt délais sont regroupés en cinq classes d’amplitudes inégales. L’effectif de chaque classe est donné.',
    'Pour chaque classe, écrivez l’effectif cumulé : le nombre de factures payées avant la borne supérieure de la classe.',
    'Écrivez ensuite la fréquence cumulée, en % de l’effectif total.',
  ],
  echeances: CLASSES_DE_DELAIS.length,
  libellesLignes: [...CLASSES_DE_DELAIS],
  parametres: { effectifTotal: DELAIS_DU_TRIMESTRE.length },
  colonnes: [
    {
      cle: 'effectif',
      intitule: 'Effectif',
      role: 'donnee',
      valeurs: [3, 8, 6, 2, 1],
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'frequence',
      intitule: 'Fréquence (%)',
      role: 'deduite',
      formule: 'effectif / effectifTotal * 100',
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'cumul',
      intitule: 'Effectif cumulé',
      role: 'saisie',
      decimales: 0,
      totalise: false,
    },
    {
      cle: 'frequenceCumulee',
      intitule: 'Fréquence cumulée (%)',
      role: 'saisie',
      decimales: 0,
      totalise: false,
    },
  ],
  synthese: [
    {
      libelle: 'Effectif total',
      formule: 'totalEffectif',
      unite: null,
      decimales: 0,
    },
    {
      libelle: 'Fréquence cumulée de la dernière classe',
      formule: 'dernierFrequenceCumulee',
      unite: '%',
      decimales: 0,
    },
  ],
} as const satisfies moteur.PlanDeTableau;

function ligneCumulee(
  rang: number,
  cumul: number,
  effectif: number,
  frequenceCumulee: number,
  frequence: number,
) {
  return [
    {
      rang,
      cle: 'cumul',
      valeur: cumul,
      pieges:
        cumul === effectif
          ? []
          : [
              {
                valeur: effectif,
                confusion: 'effectif-cumule-confondu' as const,
              },
            ],
    },
    {
      rang,
      cle: 'frequenceCumulee',
      valeur: frequenceCumulee,
      pieges:
        frequenceCumulee === frequence
          ? []
          : [
              {
                valeur: frequence,
                confusion: 'effectif-cumule-confondu' as const,
              },
            ],
    },
  ];
}

const [PREMIERE_LIGNE_CUMULEE, ...AUTRES_LIGNES_CUMULEES] = [
  ...ligneCumulee(0, 3, 3, 15, 15),
  ...ligneCumulee(1, 11, 8, 55, 40),
  ...ligneCumulee(2, 17, 6, 85, 30),
  ...ligneCumulee(3, 19, 2, 95, 10),
  ...ligneCumulee(4, 20, 1, 100, 5),
];

const CLASSES_DE_SALAIRES = [
  '< 1 500',
  '1 500–2 000',
  '2 000–2 500',
  '2 500–3 000',
  '3 000–3 500',
  '3 500–4 000',
  '4 000–4 500',
  '4 500–5 000',
  '≥ 5 000',
] as const;

const EFFECTIFS_DE_SALAIRES = [
  1928, 5563, 3979, 2365, 1464, 930, 613, 416, 1261,
] as const;

const CONSIGNE_DE_L_ATELIER_4 =
  'Calculatrice autorisée. Délais des vingt factures regroupés en classes : [0 ; 30[ : 3 factures ; [30 ; 45[ : 8 ; [45 ; 60[ : 6 ; [60 ; 90[ : 2 ; [90 ; 150[ : 1. Salaires du secteur privé en 2024 (Insee), en milliers de postes : 3 000 à 3 500 € : 1 464 ; 3 500 à 4 000 € : 930.';

const ACTE_5: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A5-01-HISTOGRAMME',
      titre: 'Les salaires du secteur privé, regroupés en classes',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['histogramme'],
      notes: moteur.puces(
        'Faire lire la classe la plus haute (1 500 à 2 000 €) : c’est la classe modale.',
        'Faire remarquer les deux classes ouvertes, aux extrémités : leur largeur est inconnue.',
        'Transition : « Que peut-on calculer quand on ne connaît que les classes ? »',
      ),
    },
    'chart',
    {
      title:
        'Salaire net mensuel du secteur privé en 2024, par tranche de 500 €',
      caption: 'Nombre de postes en équivalent temps plein, en milliers',
      labels: [...CLASSES_DE_SALAIRES],
      series: [
        {
          label: 'Postes (milliers d’EQTP)',
          values: [...EFFECTIFS_DE_SALAIRES],
          tone: 'teal',
        },
      ],
      axisRanges: [[0, 6000]],
      unit: 'milliers de postes',
      reading:
        'La tranche de 1 500 à 2 000 € regroupe le plus de postes ; au-delà, les effectifs décroissent tranche après tranche. Les deux tranches extrêmes sont ouvertes.',
      source:
        'Insee Première n° 2079, « Les salaires dans le secteur privé en 2024 », octobre 2025, figure 2 (tranches de 100 € regroupées par 500 €).',
      description:
        'Diagramme en barres de neuf tranches de salaire : moins de 1 500 €, puis tranches de 500 € de 1 500 à 5 000 €, puis 5 000 € et plus. La tranche de 1 500 à 2 000 € est la plus haute ; les effectifs décroissent ensuite régulièrement.',
    },
  ),
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A5-02-CORRECTION',
      titre: 'Correction : calculer avec des classes',
      dureeMinutes: 2,
      concepts: ['histogramme', 'mediane'],
      notes: moteur.puces(
        '« Corriger une étape de plus » : s’arrêter sur l’interpolation (étape 3) et la densité (étape 5).',
        'Faire dire : l’interpolation suppose les salaires répartis régulièrement dans la classe ; d’où l’écart avec la médiane publiée.',
        'Transition : « À vous, sur les vingt délais : les effectifs cumulés. »',
      ),
    },
    {
      screenId: 'B2-02-A5-02-CLASSES',
      titre: 'Calculer avec des classes',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['histogramme', 'mediane'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Pièges : chercher la médiane dans la classe la plus haute ; lire la hauteur d’une classe plus large comme un effectif.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: 'B2-02-A5-01-HISTOGRAMME',
        exemple: {
          id: 'b2-02-a5-classes',
          enonce:
            'L’Insee publie 18 519 milliers de postes du secteur privé répartis en tranches de salaire. Moins de 1 500 € : 1 928 ; de 1 500 à 2 000 € : 5 563 ; de 2 000 à 2 500 € : 3 979 ; puis des effectifs décroissants jusqu’à la tranche ouverte « 5 000 € et plus ».',
          etapes: [
            {
              id: 'modale',
              intitule: 'La classe modale',
              raisonnement:
                'La tranche de 1 500 à 2 000 € a le plus grand effectif (5 563 milliers de postes) : c’est la classe modale. Son centre est (1 500 + 2 000) ÷ 2 = 1 750 €.',
              invite:
                'Quelle tranche regroupe le plus de postes, et quel est son centre ?',
            },
            {
              id: 'classe-mediane',
              intitule: 'La classe médiane',
              raisonnement:
                'La moitié de l’effectif vaut 18 519 ÷ 2 = 9 259,5. Effectifs cumulés : 1 928 sous 1 500 € ; 7 491 sous 2 000 € ; 11 470 sous 2 500 €. Le 9 259,5e poste est dans la tranche de 2 000 à 2 500 €.',
              invite: 'Dans quelle tranche se trouve le salaire médian ?',
            },
            {
              id: 'interpolation',
              intitule: 'Estimer la médiane par interpolation',
              raisonnement:
                'Il manque 9 259,5 − 7 491 = 1 768,5 postes après 2 000 € ; la tranche en contient 3 979 sur 500 €. Médiane ≈ 2 000 + 500 × 1 768,5 ÷ 3 979 ≈ 2 222 €. L’Insee publie 2 190 € : l’interpolation suppose des salaires répartis régulièrement dans la tranche.',
              invite:
                'Quelle estimation de la médiane obtenez-vous en supposant les salaires répartis régulièrement dans la tranche ?',
            },
            {
              id: 'moyenne-impossible',
              intitule: 'Pourquoi pas la moyenne exacte',
              raisonnement:
                'Pour une moyenne, on remplace chaque classe par son centre. Mais les tranches « moins de 1 500 € » et « 5 000 € et plus » sont ouvertes : on ne connaît pas leur centre. Toute moyenne calculée ainsi reste une estimation fragile.',
              invite:
                'Peut-on calculer le salaire moyen exact à partir de ces tranches ? Pourquoi ?',
            },
            {
              id: 'densite',
              intitule: 'Des classes de largeurs différentes',
              raisonnement:
                'Si l’on regroupe 4 000 à 4 500 € et 4 500 à 5 000 € en une tranche de 1 000 €, elle compte 613 + 416 = 1 029 milliers de postes. Sa hauteur dans l’histogramme doit être une densité : 1 029 ÷ 10 = 102,9 milliers de postes par tranche de 100 €, pas 1 029.',
              invite:
                'Quelle hauteur donner à une tranche deux fois plus large que les autres ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-02-A5-03-EFFECTIFS-CUMULES',
    titre: 'Tableau des effectifs cumulés des vingt délais',
    diffusion: 'seance',
    brique: 'fp-table-build',
    dureeMinutes: 8,
    concepts: ['serie-statistique', 'histogramme'],
    notes: moteur.puces(
      'Individuel, 7 min ; la correction vient à l’écran suivant.',
      'Piège : recopier l’effectif de la classe au lieu de l’ajouter aux précédents.',
      'Contrôles : dernier effectif cumulé 20, dernière fréquence cumulée 100 %.',
    ),
    proprietes: {
      modalite: 'solo',
      plan: PLAN_TABLEAU,
      questions: [
        moteur.questionDeTableau(
          'b2-02-a5-effectifs-cumules',
          'serie-statistique',
          [PREMIERE_LIGNE_CUMULEE, ...AUTRES_LIGNES_CUMULEES],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A5-03-CORRECTION',
      titre: 'Correction : les effectifs cumulés',
      dureeMinutes: 1,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Faire lire la ligne [45 ; 60[ : 17 factures, soit 85 %, sont payées en moins de 60 jours.',
        'Transition : « Atelier 4 : calculer avec des classes. »',
      ),
    },
    'B2-02-A5-03-EFFECTIFS-CUMULES',
    [
      [
        'b2-02-a5-effectifs-cumules',
        'Effectifs cumulés : 3 ; 3 + 8 = 11 ; 11 + 6 = 17 ; 17 + 2 = 19 ; 19 + 1 = 20. Fréquences cumulées : 15 % ; 55 % ; 85 % ; 95 % ; 100 %. 85 % des factures sont encaissées en moins de 60 jours : 3 factures sur 20 dépassent le plafond légal.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A5-04-ATELIER-4',
    titre: 'Atelier 4 — Calculer avec des classes',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['moyenne', 'histogramme'],
    notes: moteur.puces(
      '5 min sur les questions 1 à 3, puis 1 min avec le voisin.',
      'Pièges : Q1 les bornes inférieures (36) ou supérieures (57) au lieu des centres ; Q2 l’effectif de la tranche fusionnée comme hauteur.',
    ),
    proprietes: {
      renvoi: 'B2-02-A5-03-EFFECTIFS-CUMULES',
      intitule: 'Atelier 4 — Calculer avec des classes (questions 1 à 3)',
      consigne: CONSIGNE_DE_L_ATELIER_4,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a5-moyenne-classes',
          'moyenne',
          'En remplaçant chaque classe de délais par son centre, quelle moyenne des délais estimez-vous ? Réponse en jours, arrondie au dixième.',
          'jours',
          46.5,
          { type: 'absolue', valeur: 0.05 },
          '46,5',
          [
            [36, 'centre-de-classe-oublie'],
            [57, 'centre-de-classe-oublie'],
          ],
        ),
        moteur.numerique(
          'b2-02-a5-densite',
          'histogramme',
          'On fusionne les tranches de salaire de 3 000 à 3 500 € et de 3 500 à 4 000 € en une seule tranche de 1 000 €. Dans un histogramme dont l’unité de largeur est 100 €, quelle hauteur lui donnez-vous ? Réponse en milliers de postes par tranche de 100 €, arrondie au dixième.',
          'milliers de postes',
          239.4,
          { type: 'absolue', valeur: 0.05 },
          '239,4',
          [
            [2394, 'histogramme-classes-inegales'],
            [478.8, 'histogramme-classes-inegales'],
          ],
        ),
        moteur.vote(
          'b2-02-a5-classes-ouvertes',
          'moyenne',
          true,
          'L’Insee regroupe les salaires en tranches, dont « moins de 1 500 € » et « 5 000 € et plus ». Peut-on retrouver exactement le salaire moyen à partir de ces tranches ?',
          'Non : deux tranches sont ouvertes et les salaires y sont regroupés',
          [
            [
              'Oui : avec les centres des tranches, le calcul est exact',
              'centre-de-classe-oublie',
            ],
            [
              'Oui : il suffit de prendre la moyenne des bornes',
              'centre-de-classe-oublie',
            ],
          ],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A5-04-CORRECTION-1',
      titre: 'Correction de l’atelier 4 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['moyenne', 'histogramme'],
      notes: moteur.puces(
        'Comparer la moyenne estimée par les centres à la moyenne exacte de l’atelier 1 : l’estimation est proche, pas égale.',
        'Transition : « Deux questions de plus : quel centre pour quelle série ? »',
      ),
    },
    'B2-02-A5-04-ATELIER-4',
    [
      [
        'b2-02-a5-moyenne-classes',
        'Centres : 15 ; 37,5 ; 52,5 ; 75 ; 120. (3 × 15 + 8 × 37,5 + 6 × 52,5 + 2 × 75 + 1 × 120) ÷ 20 = 930 ÷ 20 = 46,5 jours, proche de la moyenne exacte. Les bornes inférieures donneraient 36, les supérieures 57.',
      ],
      [
        'b2-02-a5-densite',
        '1 464 + 930 = 2 394 milliers de postes sur 1 000 €, soit dix unités de 100 € : hauteur 2 394 ÷ 10 = 239,4. Dessiner 2 394 ferait croire à une tranche dix fois plus peuplée.',
      ],
      [
        'b2-02-a5-classes-ouvertes',
        'Remplacer une classe par son centre suppose ses valeurs réparties régulièrement ; et les tranches ouvertes n’ont pas de centre. La médiane, elle, s’estime sans connaître les extrêmes.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A5-04-ATELIER-4-SUITE',
    titre: 'Atelier 4 — Calculer avec des classes (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['choix-du-resume'],
    notes: moteur.puces(
      '4 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 et 2).',
      'Pièges : la moyenne des locaux « parce qu’elle tient compte de tous » ; le patrimoine moyen lu comme celui du ménage typique.',
    ),
    proprietes: {
      intitule: 'Atelier 4 — Quel centre publier ? (questions 4 et 5)',
      consigne:
        'Données publiques : Statistiques DVF (data.gouv.fr, ventes 2021 à 2025) et Insee Focus n° 371 (patrimoine des ménages début 2024).',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.vote(
          'b2-02-a5-locaux',
          'choix-du-resume',
          true,
          'Ventes de locaux commerciaux en France, 2021-2025 : prix moyen 3 398 €/m², prix médian 1 473 €/m². Atelier Rivage cherche un local ordinaire. Quel chiffre retenez-vous ?',
          'Le prix médian : quelques locaux très chers tirent la moyenne',
          [
            [
              'Le prix moyen : il tient compte de tous les locaux',
              'valeur-extreme-ignoree',
            ],
            [
              'La moyenne des deux chiffres, pour être prudent',
              'moyenne-des-moyennes',
            ],
          ],
        ),
        moteur.vote(
          'b2-02-a5-patrimoine',
          'choix-du-resume',
          true,
          'Début 2024, le patrimoine brut moyen des ménages est de 374 900 € ; le patrimoine médian, de 205 100 €. Un article titre : « Le ménage français typique possède 374 900 € ». Qu’en pensez-vous ?',
          'C’est faux : la moitié des ménages possède moins de 205 100 €',
          [
            [
              'C’est juste : c’est la moyenne de tous les ménages',
              'moyenne-lue-comme-mediane',
            ],
            [
              'C’est juste, à condition d’arrondir à 375 000 €',
              'moyenne-lue-comme-mediane',
            ],
          ],
          ['moitié des ménages', '205 100'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A5-04-CORRECTION-2',
      titre: 'Correction de l’atelier 4 : questions 4 et 5',
      dureeMinutes: 1,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        'Relier les deux cas à F105 : une moyenne très supérieure à la médiane signale des valeurs extrêmes vers le haut.',
        'Transition : « Quel graphique pour quelle série ? »',
      ),
    },
    'B2-02-A5-04-ATELIER-4-SUITE',
    [
      [
        'b2-02-a5-locaux',
        'La moyenne des locaux dépasse le double de la médiane : quelques locaux de prestige la tirent. Pour un local ordinaire, la médiane est le bon repère.',
      ],
      [
        'b2-02-a5-patrimoine',
        'Les 10 % de ménages les mieux dotés détiennent près de la moitié du patrimoine : la moyenne est tirée vers le haut. Le ménage typique se décrit par la médiane.',
      ],
    ],
  ),
  ...moteur.suiviDeSaCorrection(
    {
      screenId: 'B2-02-A5-05-CORRECTION',
      titre: 'Correction : quel graphique pour quelle série ?',
      sousTitre:
        'Le graphique suit le caractère : barres pour des valeurs isolées, histogramme pour des classes, boîte pour comparer des séries, courbe pour une évolution.',
      dureeMinutes: 1,
      concepts: ['histogramme', 'boite-a-moustaches'],
      notes: moteur.puces(
        'Commencer par les deux cartes les plus ratées.',
        'Transition : « Le dossier pour la banque. »',
      ),
    },
    {
      screenId: 'B2-02-A5-05-QUEL-GRAPHIQUE',
      titre: 'Quel graphique pour quelle série ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['histogramme', 'boite-a-moustaches'],
      notes: moteur.puces(
        'Binômes, 5 min de tri, puis écran de correction.',
        'Cartes à risque : « nombre de relances » (des valeurs isolées : des barres, pas un histogramme) et « salaires en tranches inégales » (un histogramme en densité).',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b2-02-a5-quel-graphique',
            intitule:
              'Pour chaque série, choisissez le graphique qui la représente le mieux.',
          },
          'histogramme',
          [
            ['barres', 'Diagramme en barres'],
            ['histogramme', 'Histogramme'],
            ['boite', 'Boîtes à moustaches'],
            ['courbe', 'Courbe'],
          ],
          [
            {
              id: 'relances',
              libelle: 'Nombre de relances par facture : 0, 1, 2, 3 ou 4',
              categorie: 'barres',
              confusion: 'histogramme-classes-inegales',
              justification:
                'quelques valeurs isolées : une barre par valeur, sans continuité',
            },
            {
              id: 'type-client',
              libelle: 'Nombre de factures par type de client',
              categorie: 'barres',
              confusion: 'forme-inadaptee',
              justification:
                'un caractère qualitatif : des barres séparées, dans un ordre choisi',
            },
            {
              id: 'salaires',
              libelle: 'Salaires regroupés en tranches de largeurs différentes',
              categorie: 'histogramme',
              confusion: 'histogramme-classes-inegales',
              justification:
                'des classes contiguës : l’aire de chaque rectangle représente l’effectif',
            },
            {
              id: 'delais-classes',
              libelle: 'Les vingt délais regroupés en cinq classes',
              categorie: 'histogramme',
              confusion: 'histogramme-classes-inegales',
              justification:
                'un caractère continu en classes : un histogramme, en densité si les largeurs diffèrent',
            },
            {
              id: 'segments',
              libelle:
                'Délais des clubs et des chantiers, à comparer d’un coup d’œil',
              categorie: 'boite',
              confusion: 'meme-moyenne-meme-serie',
              justification:
                'deux séries côte à côte : centre et écart visibles ensemble',
            },
            {
              id: 'annees',
              libelle: 'Délais fournisseurs des entreprises, 2023 et 2024',
              categorie: 'boite',
              confusion: 'boite-lue-comme-effectif',
              justification:
                'deux distributions résumées par leurs quartiles et leurs centiles',
            },
            {
              id: 'mensuel',
              libelle: 'Délai médian de paiement, mois par mois depuis 2024',
              categorie: 'courbe',
              confusion: 'forme-inadaptee',
              justification:
                'une évolution dans le temps : les mois en abscisse, une courbe',
            },
          ],
        ),
      },
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A5-06-DOSSIER-BANQUE',
      titre: 'Le dossier pour la banque en une page',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        '1 min de lecture silencieuse, sans commentaire.',
        'Relance : « Quel chiffre de Samir reste juste ? » (la moyenne, arrondie ; c’est la conclusion qui trompe).',
        'Transition : « À vous d’écrire la note, en trois phrases. »',
      ),
    },
    'table',
    {
      title: 'Le dossier pour la banque : ce que disent les vingt délais',
      subtitle:
        'Factures professionnelles du 2e trimestre 2026 (données fictives Atelier Rivage).',
      columns: moteur.COLONNES_DU_DOSSIER,
      rows: [
        {
          rubrique: 'Série',
          contenu:
            '20 factures professionnelles émises d’avril à juin 2026 ; caractère : délai de paiement, en jours ; une facture contestée (F105, 146 jours).',
        },
        {
          rubrique: 'Centre',
          contenu:
            'Médiane 43 jours : la moitié des factures est encaissée en 43 jours au plus. Moyenne 47,75 jours, tirée vers le haut par F105 (42,58 jours sans elle).',
        },
        {
          rubrique: 'Écart',
          contenu:
            'Moitié centrale entre 31 et 52 jours (écart interquartile 21 jours). Écart-type 26,2 jours. Étendue 128 jours, due à F105.',
        },
        {
          rubrique: 'Plafond légal',
          contenu:
            '3 factures sur 20 (15 %) dépassent 60 jours : 62, 75 et 146 jours.',
        },
        {
          rubrique: 'Diapositive de Samir',
          contenu: '« En moyenne 48 jours : nous sommes dans les clous. »',
        },
      ],
    },
  ),
  {
    screenId: 'B2-02-A5-07-NOTE-BANQUE',
    titre: 'Votre note à la banque',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['choix-du-resume'],
    notes: moteur.puces(
      '3 min d’écriture, révélation, 1 min d’échange.',
      'Piège : retirer F105 pour afficher un meilleur délai.',
      'Exiger une unité et une population dans chaque phrase.',
      'Transition : jalon 5.',
    ),
    proprietes: {
      modalite: 'solo',
      renvoi: 'B2-02-A5-06-DOSSIER-BANQUE',
      probleme: {
        id: 'b2-02-a5-note-banque',
        enonce:
          'Mercredi, fin d’après-midi. Hélène renonce à la diapositive de Samir et vous demande la note qui partira demain à la banque, fondée sur le dossier.',
        invite:
          'Rédigez trois phrases : 1) le délai typique, avec la série et son unité ; 2) la régularité des paiements ; 3) la limite à signaler, et ce que vous proposez de suivre.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          moteur.strategie(
            'centre',
            'Centre : la moitié des factures professionnelles du 2e trimestre 2026 est encaissée en 43 jours au plus (médiane).',
          ),
          moteur.strategie(
            'ecart',
            'Écart : la moitié centrale des délais va de 31 à 52 jours ; l’écart-type est de 26 jours environ.',
          ),
          moteur.strategie(
            'plafond',
            'Limite : 3 factures sur 20 dépassent le plafond légal de 60 jours, dont F105, contestée, à 146 jours.',
          ),
          moteur.strategie(
            'suivi',
            'Suivi : relancer F105, surveiller les chantiers navals, et recalculer médiane et quartiles chaque trimestre.',
          ),
          moteur.strategie(
            'moyenne-signalee',
            'Moyenne : 47,75 jours, tirée par F105 ; elle se donne avec la médiane, jamais seule.',
          ),
          moteur.strategie(
            'retirer',
            'Retirer F105 pour annoncer un délai moyen de 42,6 jours.',
            true,
          ),
        ],
      },
    },
  },
  {
    screenId: 'B2-02-A5-08-JALON-5',
    titre: 'Jalon 5 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['histogramme', 'choix-du-resume'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : refaire au tableau l’étape « La classe médiane » de A5-02.',
      'Transition : « Acte 6 : un coffre, une IA, et votre rappel. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a5-jalon',
        invite:
          'Je sais calculer avec des classes, lire un histogramme et choisir le résumé à publier.',
      },
    },
  },
];

const PARCOURS_DU_COFFRE = 'b2-02-a6-coffre';

const ACTE_6: moteur.Acte = [
  {
    screenId: 'B2-02-A6-01-COFFRE',
    titre: 'Le coffre de la banque',
    diffusion: 'seance',
    brique: 'fp-escape',
    dureeMinutes: 10,
    concepts: ['mediane', 'quartiles', 'ecart-type', 'moyenne'],
    notes: moteur.puces(
      'Lancer ; indices disponibles après 60 s. À 8 min, projeter l’énigme la moins résolue.',
      'Pièges : E1 le milieu de la liste non triée ; E2 l’écart interquartile du tableur ; E3 la division par n − 1 ; E4 la moyenne simple des deux groupes.',
    ),
    proprietes: {
      modalite: 'solo',
      parcours: {
        id: PARCOURS_DU_COFFRE,
        intitule:
          'Le coffre de la banque : quatre calculs, un code pour ouvrir le dossier',
        delaiIndiceMs: 60000,
        budgetEnigmeMs: 150000,
        tentativesMax: 10,
        enigmes: [
          {
            id: 'b2-02-a6-e1-mediane',
            intitule: 'Les fournisseurs',
            enonce:
              'En septembre 2026, Atelier Rivage a payé douze fournisseurs en 30, 45, 28, 60, 35, 38, 58, 32, 46, 36, 56 et 62 jours. Quelle est la médiane de ces délais, en jours ?',
            indice:
              'Rangez d’abord les délais ; avec un effectif pair, prenez la demi-somme des deux valeurs du milieu.',
          },
          {
            id: 'b2-02-a6-e2-eiq',
            intitule: 'La moitié centrale',
            enonce:
              'Avec la convention du cours, quel est l’écart interquartile des douze délais fournisseurs, en jours ?',
            indice:
              'Le rang du premier quartile est le quart de l’effectif, arrondi à l’entier supérieur ; même chose pour les trois quarts.',
          },
          {
            id: 'b2-02-a6-e3-ecart-type',
            intitule: 'Le segment des loueurs',
            enonce:
              'Les six loueurs de bateaux, seuls clients de leur segment, ont payé en 25, 35, 45, 55, 65 et 75 jours. Quel est l’écart-type de leurs délais, en jours, arrondi au centième ?',
            indice:
              'Moyenne des carrés des écarts à la moyenne, puis racine carrée ; toute la population est là.',
          },
          {
            id: 'b2-02-a6-e4-moyenne',
            intitule: 'Deux groupes de clients',
            enonce:
              'Vingt-huit clients paient en moyenne en 30 jours, douze autres en moyenne en 75 jours. Quel est le délai moyen de l’ensemble des clients, en jours ?',
            indice:
              'Chaque moyenne compte autant de fois que son groupe a de clients.',
          },
        ],
      },
      questions: [
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          0,
          'b2-02-a6-e1-mediane',
          'mediane',
          41.5,
          0.05,
          '41,5',
          'R4',
          [
            [48, 'mediane-sans-tri'],
            [43.833333, 'moyenne-lue-comme-mediane'],
          ],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          1,
          'b2-02-a6-e2-eiq',
          'quartiles',
          24,
          0.05,
          '24',
          'T8',
          [
            [22.25, 'convention-de-quartile-ignoree'],
            [34, 'etendue-prise-pour-dispersion'],
          ],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          2,
          'b2-02-a6-e3-ecart-type',
          'ecart-type',
          17.078251,
          0.005,
          '17,08',
          'N3',
          [
            [18.708287, 'ecart-type-population-echantillon'],
            [291.666667, 'variance-confondue-avec-ecart-type'],
          ],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          3,
          'b2-02-a6-e4-moyenne',
          'moyenne',
          43.5,
          0.05,
          '43,5',
          'W6',
          [[52.5, 'moyenne-des-moyennes']],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A6-01-CORRECTION',
      titre: 'Correction du coffre : les quatre calculs',
      dureeMinutes: 1,
      concepts: ['mediane', 'quartiles', 'ecart-type', 'moyenne'],
      notes: moteur.puces(
        'S’attarder sur l’énigme la moins résolue (pupitre).',
        'Faire relier chaque énigme à son acte : E1 la médiane (A2-02), E2 les quartiles (A3-02), E3 l’écart-type (A3-02), E4 la moyenne avec effectifs (A2-02).',
        'Transition : « Une dernière réponse à corriger : celle d’une IA. »',
      ),
    },
    'B2-02-A6-01-COFFRE',
    [
      [
        'b2-02-a6-e1-mediane',
        'Triés : 28 ; 30 ; 32 ; 35 ; 36 ; 38 ; 45 ; 46 ; 56 ; 58 ; 60 ; 62. Médiane = (38 + 45) ÷ 2 = 41,5 jours. Le milieu de la liste non triée (38 et 58) donnerait 48.',
      ],
      [
        'b2-02-a6-e2-eiq',
        'n = 12 : Q1 est la 3e valeur triée, 32 ; Q3 la 9e, 56. EIQ = 24 jours. Le tableur, qui interpole, donnerait 56,5 − 34,25 = 22,25.',
      ],
      [
        'b2-02-a6-e3-ecart-type',
        'Moyenne 50 ; carrés des écarts 625, 225, 25, 25, 225, 625, de somme 1 750 ; variance 1 750 ÷ 6 ≈ 291,67 jours² ; écart-type ≈ 17,08 jours.',
      ],
      [
        'b2-02-a6-e4-moyenne',
        '(28 × 30 + 12 × 75) ÷ 40 = (840 + 900) ÷ 40 = 43,5 jours. La moyenne simple des deux groupes, 52,5 jours, oublie qu’ils n’ont pas le même effectif.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A6-02-IA-ERREUR',
    titre: 'Corriger une réponse d’IA',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['mediane', 'ecart-type'],
    notes: moteur.puces(
      '3 min d’écriture, révélation, 1 min d’échange.',
      'Repérer qui trouve les deux erreurs, et qui propose un contrôle au tableur.',
      'Rappeler le cadre de B2-01 : l’IA propose, le professionnel vérifie et signe.',
      'Transition : « Votre rappel personnel. »',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-02-a6-ia-erreur',
        enonce:
          'Samir a collé les vingt délais dans un assistant IA en demandant « un résumé pour la banque ». Réponse obtenue : « Délai moyen : 47,75 jours, donc la moitié de vos clients paie en plus de 47,75 jours. Écart-type (fonction ECARTYPE) : 26,88 jours. »',
        invite:
          'Trouvez les deux erreurs, corrigez-les, puis écrivez le contrôle que vous feriez au tableur.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          moteur.strategie(
            'moitie',
            'Erreur 1 : la moyenne ne partage pas la série en deux moitiés ; seules 7 factures sur 20 dépassent 47,75 jours. La moitié des factures est encaissée en 43 jours au plus (médiane).',
          ),
          moteur.strategie(
            'population',
            'Erreur 2 : les vingt factures forment toute la population du trimestre ; l’écart-type se calcule avec ECARTYPEP : 26,20 jours.',
          ),
          moteur.strategie(
            'tableur',
            'Contrôle au tableur : =MEDIANE(B2:B21) et =ECARTYPEP(B2:B21), puis vérifier que NB(B2:B21) vaut bien 20.',
          ),
          moteur.strategie(
            'garder',
            'Garder la réponse : la moyenne est juste, le reste n’est qu’un détail.',
            true,
          ),
        ],
      },
    },
  },
  {
    screenId: 'B2-02-A6-03-RAPPEL',
    titre: 'Rappel : de mémoire, sans vos notes',
    diffusion: 'seance',
    brique: 'fp-spaced',
    dureeMinutes: 4,
    concepts: [...CONCEPTS_DU_B2_02],
    notes: moteur.puces(
      '3 min individuelles, puis projeter la carte de maîtrise.',
      'Tous reçoivent les deux questions obligatoires (valeur extrême, variance), en plus de leurs points faibles.',
      'Annoncer que les concepts restés en boîte 1 pour plus de 30 % de la classe ouvriront B2-03.',
    ),
    proprietes: {
      rappel: {
        id: 'b2-02-a6-rappel',
        intitule: 'Rappel : de mémoire, sans vos notes',
      },
      banque: {
        questions: [
          moteur.rappel(
            'b2-02-r-vocabulaire',
            'serie-statistique',
            'Dans une étude des salaires d’une entreprise, que désigne « le salaire mensuel net » ?',
            'Le caractère observé',
            [
              ['La population étudiée', 'role-statistique-confondu'],
              ['L’effectif', 'role-statistique-confondu'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-cumule',
            'serie-statistique',
            'Effectifs par classe : 4, 7, 5, 4. Quel est l’effectif cumulé de la troisième classe ?',
            '16, en ajoutant les trois premières classes',
            [
              ['5, l’effectif de la classe seule', 'effectif-cumule-confondu'],
              [
                '20, l’effectif de toutes les classes',
                'effectif-cumule-confondu',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-mediane-paire',
            'mediane',
            'Quelle est la médiane de la série 12, 15, 20, 26, 31, 40 ?',
            '23, la demi-somme des deux valeurs du milieu',
            [
              ['20, la troisième valeur seule', 'mediane-rang-pair'],
              ['24, la moyenne des six valeurs', 'moyenne-lue-comme-mediane'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-mediane-tri',
            'mediane',
            'Quelle est la médiane de la série 9, 2, 7, 4, 5 ?',
            '5, la valeur du milieu une fois la série triée',
            [
              ['7, la valeur du milieu de la liste', 'mediane-sans-tri'],
              ['5,4, la moyenne des cinq valeurs', 'moyenne-lue-comme-mediane'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-moyenne-groupes',
            'moyenne',
            'Une classe de 10 élèves a 12 de moyenne, une autre de 30 élèves a 8. Quelle est la moyenne des 40 élèves ?',
            '9, chaque moyenne pesant selon son effectif',
            [
              ['10, la moyenne des deux moyennes', 'moyenne-des-moyennes'],
              ['20, la somme des deux moyennes', 'moyenne-des-moyennes'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-quartile',
            'quartiles',
            'Série triée de 8 valeurs : 3, 5, 6, 8, 9, 11, 14, 20. Avec la convention du cours, que vaut Q1 ?',
            '5, la deuxième valeur de la série triée',
            [
              ['4,25, la moitié de la médiane', 'quartile-moitie-de-mediane'],
              [
                '5,75, le quartile interpolé du tableur',
                'convention-de-quartile-ignoree',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-etendue',
            'dispersion',
            'Deux séries ont la même étendue. Ont-elles la même dispersion ?',
            'Pas forcément : l’étendue ne regarde que les deux extrêmes',
            [
              ['Oui, toujours', 'etendue-prise-pour-dispersion'],
              ['Oui, si elles ont la même moyenne', 'meme-moyenne-meme-serie'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-variance',
            'ecart-type',
            'La variance d’une série de délais vaut 36 jours². Quel est son écart-type ?',
            '6 jours, la racine carrée de la variance',
            [
              [
                '36 jours, la variance elle-même',
                'variance-confondue-avec-ecart-type',
              ],
              [
                '18 jours, la moitié de la variance',
                'variance-confondue-avec-ecart-type',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-population',
            'ecart-type',
            'On a mesuré les délais de tous les clients de l’année. Quelle fonction d’écart-type utiliser ?',
            'ECARTYPEP, division par n',
            [
              [
                'ECARTYPE, division par n − 1',
                'ecart-type-population-echantillon',
              ],
              ['VAR, la variance', 'variance-confondue-avec-ecart-type'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-boite',
            'boite-a-moustaches',
            'Dans une boîte à moustaches, la partie entre la médiane et Q3 est deux fois plus longue que celle entre Q1 et la médiane. Contient-elle plus de valeurs ?',
            'Non : chacune contient un quart des valeurs',
            [
              ['Oui, deux fois plus', 'boite-lue-comme-effectif'],
              ['Oui, la moitié des valeurs', 'boite-lue-comme-effectif'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-densite',
            'histogramme',
            'Classes de 10 € sauf une de 30 €, qui compte 90 individus. Quelle hauteur lui donner, en individus par tranche de 10 € ?',
            '30, l’effectif divisé par trois largeurs',
            [
              ['90, l’effectif de la classe', 'histogramme-classes-inegales'],
              [
                '270, l’effectif multiplié par trois',
                'histogramme-classes-inegales',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-centre',
            'moyenne',
            'Pour estimer une moyenne à partir de classes, quelle valeur prend-on pour chaque classe ?',
            'Le centre de la classe',
            [
              ['Sa borne inférieure', 'centre-de-classe-oublie'],
              ['Sa borne supérieure', 'centre-de-classe-oublie'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-extreme',
            'choix-du-resume',
            'Une facture contestée rend la série très étirée. Que faites-vous ?',
            'La garder, la signaler et donner la médiane avec la moyenne',
            [
              ['La retirer sans le dire', 'valeur-extreme-supprimee'],
              ['Donner la moyenne seule', 'valeur-extreme-ignoree'],
            ],
          ),
        ],
        obligatoires: ['b2-02-r-extreme', 'b2-02-r-variance'],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A6-04-FICHE-MEMO',
      titre: 'Fiche mémo : quel indicateur pour quelle question ?',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: [...CONCEPTS_DU_B2_02],
      notes: moteur.puces(
        '90 s de lecture.',
        'Relance : « Quelle carte pour "une facture contestée fausse le délai moyen" ? » (choisir le résumé).',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : quel indicateur pour quelle question ?',
      subtitle:
        'À garder pour le CCF : chaque carte part d’une question et donne la méthode et son piège.',
      imprimable: true,
      items: [
        {
          title: 'Décrire',
          description: 'Qu’a-t-on observé ?',
          back: 'Population, caractère (qualitatif ou quantitatif), effectif, unité, période, source.',
        },
        {
          title: 'Moyenne',
          description: 'Raisonne-t-on sur un total ?',
          back: 'Somme des valeurs ÷ effectif ; avec des effectifs : Σ nᵢ xᵢ ÷ N. Jamais la moyenne simple de moyennes de groupes inégaux.',
        },
        {
          title: 'Médiane',
          description: 'Cherche-t-on une moitié ou un individu typique ?',
          back: 'Trier d’abord. Effectif impair : la valeur du milieu ; pair : la demi-somme des deux valeurs du milieu.',
        },
        {
          title: 'Quartiles',
          description: 'Où se situe la moitié centrale ?',
          back: 'Convention du cours : Q1 au rang ⌈n ÷ 4⌉, Q3 au rang ⌈3n ÷ 4⌉ de la série triée. Le tableur interpole : signalez la convention.',
        },
        {
          title: 'Écart',
          description: 'Les valeurs sont-elles régulières ?',
          back: 'Étendue = max − min (deux valeurs seulement) ; écart interquartile = Q3 − Q1 ; écart-type = √(moyenne des carrés des écarts).',
        },
        {
          title: 'Écart-type',
          description: 'n ou n − 1 ?',
          back: 'Toute la population observée : ECARTYPEP (÷ n). Un échantillon pour estimer : ECARTYPE (÷ n − 1). La variance est en unité².',
        },
        {
          title: 'Boîte à moustaches',
          description: 'Comparer deux séries d’un coup d’œil ?',
          back: 'Cinq nombres. Chaque partie de la boîte contient un quart des valeurs : sa longueur dit l’étalement, pas l’effectif. Vérifiez où s’arrêtent les moustaches.',
        },
        {
          title: 'Classes',
          description: 'Les valeurs sont regroupées ?',
          back: 'Moyenne estimée avec les centres ; médiane dans la classe où l’effectif cumulé dépasse N ÷ 2 ; classes ouvertes : pas de moyenne exacte.',
        },
        {
          title: 'Histogramme',
          description: 'Des classes de largeurs différentes ?',
          back: 'La hauteur est une densité : effectif ÷ largeur. C’est l’aire qui représente l’effectif.',
        },
        {
          title: 'Choisir le résumé',
          description: 'Une valeur extrême tire la série ?',
          back: 'La garder et la signaler ; publier la médiane avec la moyenne, et un indicateur d’écart. Seule une pièce autorise à corriger une valeur.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A6-05-BOITE-A-OUTILS',
      titre: 'Pour aller plus loin : outils et sources',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Montrer les cartes « Statistiques DVF » et « QUARTILE ».',
        'Devoir à déposer : télécharger le fichier DVF des départements et comparer, pour les locaux commerciaux, prix moyen et prix médian.',
        'Transition : « Billet de sortie. »',
      ),
    },
    'grid',
    {
      title: 'Pour aller plus loin : outils et sources',
      items: [
        {
          title: 'MOYENNE, MEDIANE, QUARTILE',
          description: 'Les fonctions de position du tableur.',
          back: 'QUARTILE interpole entre deux valeurs : son résultat peut différer de la convention du programme.',
        },
        {
          title: 'ECARTYPEP et ECARTYPE',
          description: 'Population entière ou échantillon.',
          back: 'Dans Excel : ECARTYPE.PEARSON et ECARTYPE.STANDARD.',
        },
        {
          title: 'Fonctions statistiques (LibreOffice Calc)',
          description: 'L’aide officielle des fonctions statistiques.',
          href: 'https://help.libreoffice.org/latest/fr/text/scalc/01/04060108.html',
          external: true,
        },
        {
          title: 'Salaires du secteur privé (Insee)',
          description: 'Distribution, déciles et moyennes par catégorie.',
          href: 'https://www.insee.fr/fr/statistiques/8657156',
          external: true,
        },
        {
          title: 'Patrimoine des ménages (Insee)',
          description: 'Moyenne et médiane très éloignées.',
          href: 'https://www.insee.fr/fr/statistiques/8672665',
          external: true,
        },
        {
          title: 'Délais de paiement (Banque de France)',
          description: 'Centiles des délais clients et fournisseurs.',
          href: 'https://www.banque-france.fr/fr/publications-et-statistiques/publications/les-delais-de-paiement-se-sont-reduits-en-2024-sauf-pour-les-grandes-entreprises-qui-sont-de-plus',
          external: true,
        },
        {
          title: 'Statistiques DVF (data.gouv.fr)',
          description: 'Prix moyens et médians au m², par département.',
          href: 'https://www.data.gouv.fr/datasets/statistiques-dvf',
          external: true,
        },
        {
          title: 'Délais de paiement légaux',
          description: 'Code de commerce, article L441-10.',
          href: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414277',
          external: true,
        },
        moteur.REFERENTIEL_DU_BTS_CG,
      ],
    },
  ),
  {
    screenId: 'B2-02-A6-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la phrase pour la banque',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 3,
    concepts: ['choix-du-resume'],
    notes: moteur.puces(
      '3 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : la phrase de Samir, et celle qui retire F105.',
      'Transition : « Rendez-vous en B2-03. »',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-02-a6-billet',
          'choix-du-resume',
          true,
          'La banque ne lira qu’une phrase. Laquelle peut partir telle quelle ?',
          'La moitié de nos factures professionnelles est encaissée en 43 jours au plus ; la moitié centrale entre 31 et 52 jours ; 3 sur 20 dépassent 60 jours.',
          [
            [
              'Nos clients professionnels paient en moyenne à 48 jours : nous sommes dans les clous.',
              'valeur-extreme-ignoree',
            ],
            [
              'Hors facture contestée, nos clients paient en moyenne à 42,6 jours, bien sous le plafond légal.',
              'valeur-extreme-supprimee',
            ],
            [
              'Nos délais sont réguliers : la moitié des factures est payée en moins de 47,75 jours.',
              'moyenne-lue-comme-mediane',
            ],
          ],
          ['43 jours', '3 sur 20'],
        ),
      ],
      invite:
        'Quels deux chiffres du dossier prouvent que cette phrase est juste ? Écrivez-les avec leur unité.',
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'role-statistique-confondu': 'B2-02-A1-07-FICHE-SERIE',
  'effectif-cumule-confondu': 'B2-02-A5-03-EFFECTIFS-CUMULES',
  'moyenne-lue-comme-mediane': 'B2-02-A2-02-DEUX-CENTRES',
  'mediane-sans-tri': 'B2-02-A2-02-DEUX-CENTRES',
  'mediane-rang-pair': 'B2-02-A2-02-DEUX-CENTRES',
  'valeur-extreme-ignoree': 'B2-02-A2-04-FACTURE-LITIGE',
  'valeur-extreme-supprimee': 'B2-02-A2-04-FACTURE-LITIGE',
  'moyenne-des-moyennes': 'B2-02-A2-02-DEUX-CENTRES',
  'quartile-moitie-de-mediane': 'B2-02-A3-02-DISPERSION',
  'convention-de-quartile-ignoree': 'B2-02-A4-02-FEUILLE-DELAIS',
  'etendue-prise-pour-dispersion': 'B2-02-A3-02-DISPERSION',
  'meme-moyenne-meme-serie': 'B2-02-A3-01-VOTE-SEGMENTS',
  'variance-confondue-avec-ecart-type': 'B2-02-A3-02-DISPERSION',
  'ecart-type-population-echantillon': 'B2-02-A3-03-DEUX-ECARTS-TYPES',
  'boite-lue-comme-effectif': 'B2-02-A4-03-BOITE-DELAIS',
  'centre-de-classe-oublie': 'B2-02-A5-02-CLASSES',
  'histogramme-classes-inegales': 'B2-02-A5-02-CLASSES',
  'forme-inadaptee': 'B2-02-A5-05-QUEL-GRAPHIQUE',
};

const MEDIAS: ContenuDeCours['medias'] = [
  {
    id: 'M1',
    chemins: ['/assets/cours/b2-02/v1/quetelet-1875.webp'],
    pageSource:
      'https://commons.wikimedia.org/wiki/File:Adolphe_Qu%C3%A9telet_by_Joseph-Arnold_Demannez.jpg',
    auteur:
      'Joseph-Arnold Demannez, gravure sur acier, Annuaire de l’Académie royale de Belgique, vol. 41, p. 108',
    date: '1875',
    licence: 'domaine public',
    attribution:
      'Gravure de Joseph-Arnold Demannez, 1875 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M2',
    chemins: ['/assets/cours/b2-02/v1/galton-1890.webp'],
    pageSource:
      'https://commons.wikimedia.org/wiki/File:Sir_Francis_Galton,_circa_1890.jpg',
    auteur: 'Graham’s Art Studios (crédit National Portrait Gallery, Londres)',
    date: 'vers 1890',
    licence: 'domaine public',
    attribution:
      'Graham’s Art Studios, vers 1890 · Wikimedia Commons (domaine public)',
  },
];

export const COURS_B2_02 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4, ACTE_5, ACTE_6],
  REMEDIATIONS,
  MEDIAS,
  {
    slug: 'b2-02-serie-statistique-une-variable',
    titre: 'Résumer une série sans la trahir',
    dureeMinutes: 204,
    concepts: [...CONCEPTS_DU_B2_02],
  },
);
