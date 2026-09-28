import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import * as moteur from './briques';

const CONCEPTS_DU_COURS = [
  'serie-statistique',
  'moyenne',
  'mediane',
  'ecart-type',
  'dispersion',
  'choix-du-resume',
  'nuage-de-points',
  'correlation',
  'ajustement-affine',
  'prevision',
] as const satisfies readonly ConceptId[];

const DELAIS_DU_TRIMESTRE = [
  42, 25, 58, 31, 146, 38, 47, 18, 62, 44, 35, 52, 28, 75, 40, 30, 55, 34, 50,
  45,
] as const;

const CLIENTS_DU_TRIMESTRE = [
  'Club nautique',
  'École de voile',
  'Chantier naval',
  'Club nautique',
  'Chantier naval',
  'Loueur de bateaux',
  'Club nautique',
  'École de voile',
  'Chantier naval',
  'Loueur de bateaux',
  'Club nautique',
  'Chantier naval',
  'École de voile',
  'Chantier naval',
  'Club nautique',
  'Loueur de bateaux',
  'Chantier naval',
  'Club nautique',
  'Loueur de bateaux',
  'Club nautique',
] as const;

const FACTURE_EN_LITIGE = 'F105';

const FACTURES_PAR_BLOC = DELAIS_DU_TRIMESTRE.length / 2;

function numeroDeFacture(rang: number): string {
  return `F${101 + rang}`;
}

function celluleDeFacture(rang: number, bloc: 1 | 2): Record<string, string> {
  const facture = numeroDeFacture(rang);
  return {
    [`facture${bloc}`]: facture,
    [`client${bloc}`]:
      facture === FACTURE_EN_LITIGE
        ? `${CLIENTS_DU_TRIMESTRE[rang]} (facture contestée)`
        : CLIENTS_DU_TRIMESTRE[rang],
    [`delai${bloc}`]: String(DELAIS_DU_TRIMESTRE[rang]),
  };
}

const ANNEES_RIVAGE = [2020, 2021, 2022, 2023, 2024, 2025] as const;
const CA_RIVAGE = [610, 652, 694, 736, 790, 826] as const;

const ANNEES_FIBRE = [2020, 2021, 2022, 2023, 2024] as const;
const FIBRE_EN_MILLIONS = ['10,3', '14,5', '18,1', '21,4', '24,4'] as const;

const CONSIGNE_DES_DELAIS =
  'Calculatrice autorisée. Délais de paiement des vingt factures du trimestre, de F101 à F120 : 42 ; 25 ; 58 ; 31 ; 146 ; 38 ; 47 ; 18 ; 62 ; 44 ; 35 ; 52 ; 28 ; 75 ; 40 ; 30 ; 55 ; 34 ; 50 ; 45 (jours). Les vingt factures forment toute la population étudiée.';

const CONSIGNE_DE_RIVAGE =
  'Calculatrice autorisée. Chiffre d’affaires d’Atelier Rivage, en milliers d’euros, pour les rangs x = 1 à 6 (années 2020 à 2025) : 610 ; 652 ; 694 ; 736 ; 790 ; 826.';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-02-A1-01-DIAGNOSTIC',
    titre: 'Diagnostic : le délai du milieu',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['mediane'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun choisit sans calculatrice.',
      'Pièges : la moyenne (250 ÷ 5) et la valeur du milieu de la liste non triée (140).',
      'Papier : la question est en tête du livret ; vote à main levée.',
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
      titre: 'Résumer, relier, prévoir',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        'Rappeler en une phrase B2-01 : Atelier Rivage a décidé, la banque veut maintenant des chiffres.',
        'Annoncer le plan : trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), puis une mini-situation CCF.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Résumer, relier, prévoir',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. La banque demande le délai de paiement des clients et sa régularité, puis une prévision du chiffre d’affaires pour dimensionner une facilité de caisse.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · deuxième cours de mathématiques',
        'Trois notions : résumer une série, relier deux variables, prévoir avec une droite',
        'Une mini-situation CCF et sa question tableur',
      ],
    },
  ),
  {
    screenId: 'B2-02-A1-03-MISSION',
    titre: 'Votre mission : le dossier de la banque',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 5,
    concepts: ['serie-statistique'],
    notes: moteur.puces(
      'Lecture à voix haute (90 s), puis 3 min d’écriture individuelle.',
      'Au pupitre, lire deux réponses à « Combien de nombres ? » : l’une propose un seul délai, l’autre un délai et un écart.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 8 h 40. Hélène Garnier, la dirigeante, vous transfère le courriel de la banque : « Pour dimensionner votre facilité de caisse, indiquez-nous le délai de paiement de vos clients professionnels et sa régularité, puis une prévision argumentée de votre chiffre d’affaires 2028. »',
      geste:
        'Avant de calculer quoi que ce soit, répondez par écrit aux trois questions ci-dessous.',
      consequence:
        'Un délai trompeur ou une prévision sans réserve peut conduire la banque à sous-dimensionner la facilité de caisse, et Atelier Rivage à manquer de trésorerie.',
      questionsLibres: [
        {
          id: 'b2-02-a1-mission:quoi',
          question: 'Que mesure-t-on exactement, et sur quelles données ?',
          placeholder: 'Le délai entre…, pour les factures…',
        },
        {
          id: 'b2-02-a1-mission:combien',
          question: 'Un seul nombre suffit-il à répondre sur les délais ?',
          placeholder: 'Un délai typique, un écart…',
        },
        {
          id: 'b2-02-a1-mission:verifier',
          question: 'Que faut-il vérifier avant de prévoir une année future ?',
          placeholder: 'Une tendance, une limite…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-04-FACTURES',
      titre: 'Les vingt délais de paiement du trimestre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['serie-statistique'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire repérer la facture F105, contestée par le client, et son délai qui dépasse de loin les autres.',
      ),
    },
    'table',
    {
      title: 'Les vingt délais de paiement du trimestre',
      subtitle:
        'Factures aux clients professionnels émises au dernier trimestre, toutes encaissées depuis.',
      columns: [1, 2].flatMap((bloc) => [
        { key: `facture${bloc}`, label: 'Facture' },
        { key: `client${bloc}`, label: 'Type de client' },
        { key: `delai${bloc}`, label: 'Délai (jours)' },
      ]),
      rows: Array.from({ length: FACTURES_PAR_BLOC }, (_, ligne) => ({
        ...celluleDeFacture(ligne, 1),
        ...celluleDeFacture(ligne + FACTURES_PAR_BLOC, 2),
      })),
      note: 'Délai = nombre de jours entre l’émission de la facture et son encaissement. Données fictives Atelier Rivage, créées pour ce cours.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-05-UN-SEUL-NOMBRE',
      titre: 'Réfléchir : un seul nombre suffit-il ?',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['choix-du-resume'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 1 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-02-a1-un-seul-nombre',
        type: 'reflection',
        question:
          'Hélène veut annoncer un seul délai à la banque. Quel nombre choisiriez-vous pour résumer les vingt délais, et que risque-t-il de cacher ?',
        placeholder: 'Je choisirais… parce que… Il cache…',
        competency: 'Raisonner · choisir un résumé adapté à la série',
      },
    },
    {
      correction: {
        expected:
          'Un centre seul ne suffit pas : la facture contestée de 146 jours tire la moyenne vers le haut, et un centre ne dit rien de la régularité. Il faut un centre choisi en connaissance de cause et une mesure de l’écart.',
        nextAction:
          'Gardez votre réponse : la trace écrite dit comment choisir le centre et mesurer l’écart.',
      },
      renvoi: 'B2-02-A1-04-FACTURES',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A1-06-COURS-RESUMER',
      titre: 'Cours : résumer une série par un centre et un écart',
      diffusion: 'catalogue',
      dureeMinutes: 6,
      concepts: ['moyenne', 'mediane', 'ecart-type', 'dispersion'],
      notes: moteur.puces(
        'Trace écrite à recopier ou à coller dans le livret : 6 min au plus.',
        'Insister sur le tri avant la médiane et sur ECARTYPEP pour une population entière.',
      ),
    },
    'lesson',
    {
      title: 'Résumer une série par un centre et un écart',
      subtitle: 'Trace écrite · notion 1',
      blocks: [
        {
          kind: 'definition',
          title: 'Deux centres : la moyenne et la médiane',
          text: 'La moyenne répartit le total également entre les valeurs. La médiane partage la série triée en deux groupes de même effectif.',
          formula: 'x̄ = (x₁ + x₂ + … + xₙ) ÷ n',
          steps: [
            'Trier la série dans l’ordre croissant.',
            'Effectif impair : la médiane est la valeur du milieu.',
            'Effectif pair : la médiane est la demi-somme des deux valeurs du milieu.',
          ],
        },
        {
          kind: 'definition',
          title: 'Mesurer l’écart',
          text: 'L’étendue (maximum − minimum) ne regarde que deux valeurs. L’écart-type mesure l’écart moyen à la moyenne, dans l’unité de la série ; la variance, son carré, est en unité².',
          formula: 'σ = √[((x₁ − x̄)² + … + (xₙ − x̄)²) ÷ n]',
        },
        {
          kind: 'property',
          title: 'Une valeur extrême',
          text: 'Une valeur extrême tire la moyenne et l’écart-type, pas la médiane. Sans pièce prouvant une erreur, on la garde, on la signale et l’on publie la médiane à côté de la moyenne.',
        },
        {
          kind: 'exam',
          title: 'Au CCF, au tableur',
          text: 'Population entière : ECARTYPEP, qui divise par n ; ECARTYPE divise par n − 1, pour un échantillon. Toujours donner l’unité.',
          steps: ['=MOYENNE(plage)', '=MEDIANE(plage)', '=ECARTYPEP(plage)'],
        },
      ],
    },
  ),
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A1-07-CORRECTION',
      titre: 'Correction : huit factures de septembre',
      dureeMinutes: 2,
      concepts: ['moyenne', 'mediane', 'ecart-type'],
      notes: moteur.puces(
        'S’arrêter sur le tri (étape 2) et sur l’effet de la facture de 90 jours (étape 4).',
        'Transition : « À vous, sur les vingt délais : exercice 1. »',
      ),
    },
    {
      screenId: 'B2-02-A1-07-EXEMPLE-RESUME',
      titre: 'Exemple guidé : huit factures de septembre',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 6,
      concepts: ['moyenne', 'mediane', 'ecart-type'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-02-a1-exemple-resume',
          enonce:
            'En septembre, Atelier Rivage a encaissé huit factures professionnelles en 28, 41, 35, 90, 33, 39, 44 et 30 jours. Hélène veut un délai typique et sa régularité.',
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
                'Huit valeurs : la médiane est la demi-somme des 4e et 5e valeurs triées, (35 + 39) ÷ 2 = 37 jours.',
              invite:
                'Quel délai partage les huit factures en deux groupes de même effectif ?',
            },
            {
              id: 'extreme',
              intitule: 'L’effet d’une valeur extrême',
              raisonnement:
                'La facture de 90 jours tire la moyenne cinq jours au-dessus de la médiane ; la médiane ne dépend que du rang des valeurs du milieu.',
              invite:
                'Pourquoi la moyenne dépasse-t-elle nettement la médiane ?',
            },
            {
              id: 'ecart-type',
              intitule: 'L’écart-type',
              raisonnement:
                'Carrés des écarts à 42,5 : 210,25 ; 2,25 ; 56,25 ; 2 256,25 ; 90,25 ; 12,25 ; 2,25 ; 156,25, de somme 2 786. Variance = 2 786 ÷ 8 = 348,25 jours² ; écart-type = √348,25 ≈ 18,66 jours.',
              invite: 'Quel est l’écart-type des huit délais ?',
            },
            {
              id: 'choix',
              intitule: 'Choisir le résumé',
              raisonnement:
                'On garde la facture de 90 jours, on la signale, et l’on annonce la médiane (37 jours) avec la moyenne et l’écart-type : la banque voit le délai typique et la régularité.',
              invite: 'Quel résumé transmettre à Hélène ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-02-A1-08-ATELIER-RESUME',
    titre: 'Exercice 1 — Le centre et l’écart des vingt délais',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 10,
    concepts: ['mediane', 'moyenne', 'ecart-type', 'choix-du-resume'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 8 min',
      'Réflexion : chacun relit la trace écrite et note la méthode de chaque question, sans calculer.',
      'Pièges : le milieu de la liste non triée ; une seule des deux valeurs centrales ; ECARTYPE au lieu de ECARTYPEP ; F105 retirée.',
      'Papier : exercice 1 du livret.',
    ),
    proprietes: {
      intitule: 'Exercice 1 — Le centre et l’écart des vingt délais',
      consigne: CONSIGNE_DES_DELAIS,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a1-mediane',
          'mediane',
          'Quelle est la médiane des vingt délais de paiement ? Réponse en jours.',
          'jours',
          43,
          { type: 'absolue', valeur: 0.05 },
          '43',
          [
            [39.5, 'mediane-sans-tri'],
            [42, 'mediane-rang-pair'],
            [47.75, 'moyenne-lue-comme-mediane'],
          ],
        ),
        moteur.numerique(
          'b2-02-a1-moyenne',
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
        moteur.numerique(
          'b2-02-a1-ecart-type',
          'ecart-type',
          'Quel est l’écart-type des vingt délais ? Réponse en jours, arrondie au dixième.',
          'jours',
          26.200906,
          { type: 'absolue', valeur: 0.05 },
          '26,2',
          [
            [26.881563, 'ecart-type-population-echantillon'],
            [686.4875, 'variance-confondue-avec-ecart-type'],
          ],
        ),
        moteur.vote(
          'b2-02-a1-resume',
          'choix-du-resume',
          true,
          'La facture F105 (146 jours) est contestée par le client. Quel résumé des délais envoyer à la banque ?',
          'Garder F105, la signaler, et publier la médiane avec la moyenne et l’écart-type',
          [
            [
              'Retirer F105 et publier la moyenne des dix-neuf autres délais',
              'valeur-extreme-supprimee',
            ],
            [
              'Publier la moyenne seule, arrondie au jour',
              'valeur-extreme-ignoree',
            ],
          ],
          ['Garder F105'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A1-08-CORRECTION',
      titre: 'Correction de l’exercice 1',
      dureeMinutes: 2,
      concepts: ['mediane', 'moyenne', 'ecart-type', 'choix-du-resume'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie (score sous chaque correction).',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ),
    },
    'B2-02-A1-08-ATELIER-RESUME',
    [
      [
        'b2-02-a1-mediane',
        'Série triée : 18 ; 25 ; 28 ; 30 ; 31 ; 34 ; 35 ; 38 ; 40 ; 42 ; 44 ; 45 ; … ; 146. Vingt valeurs : médiane = (10e + 11e) ÷ 2 = (42 + 44) ÷ 2 = 43 jours. Sans tri, le milieu de la liste donne 39,5, un nombre sans signification.',
      ],
      [
        'b2-02-a1-moyenne',
        'Somme des délais : 955 jours ; 955 ÷ 20 = 47,75 jours. Sans F105, on trouverait 42,58 : retirer la facture change le résultat sans pièce qui le justifie.',
      ],
      [
        'b2-02-a1-ecart-type',
        'ECARTYPEP donne ≈ 26,2 jours : les vingt factures sont toute la population. ECARTYPE (÷ 19) donnerait 26,88 ; la variance, 686,49 jours², n’est pas dans l’unité des délais.',
      ],
      [
        'b2-02-a1-resume',
        'La moyenne, tirée par F105, dépasse la médiane de près de cinq jours. On garde F105, on la signale, et l’on donne la médiane avec la moyenne et l’écart-type.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A1-09-JALON',
    titre: 'Jalon 1 : résumer une série',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['choix-du-resume'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A1-06 après la pause.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a1-jalon',
        invite:
          'Je sais résumer une série par un centre et un écart, et choisir entre moyenne et médiane.',
      },
    },
  },
];

const X_MOYEN_RIVAGE = 3.5;
const Y_MOYEN_RIVAGE = 718;
const RANG_DU_MILIEU_DU_TABLEAU = 3;

const [PREMIER_ECART, ...AUTRES_ECARTS] = CA_RIVAGE.flatMap((ca, rang) => [
  {
    rang,
    cle: 'ecartX',
    valeur: rang + 1 - X_MOYEN_RIVAGE,
    pieges: [
      {
        valeur: rang + 1 - RANG_DU_MILIEU_DU_TABLEAU,
        confusion: 'point-moyen-confondu' as const,
      },
    ],
  },
  { rang, cle: 'ecartY', valeur: ca - Y_MOYEN_RIVAGE, pieges: [] },
]);

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A2-01-NUAGE-RIVAGE',
      titre: 'Six années de chiffre d’affaires d’Atelier Rivage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['nuage-de-points'],
      notes: moteur.puces(
        '1 min de lecture : que montre le nuage ?',
        'Relance : « Peut-on prolonger cette tendance jusqu’en 2028 ? » Pas de réponse : c’est la suite du cours.',
      ),
    },
    'scatter',
    {
      title: 'Six années de chiffre d’affaires d’Atelier Rivage',
      subtitle:
        'Rang de l’année en abscisse (1 pour 2020), chiffre d’affaires annuel en milliers d’euros.',
      xLabel: 'Rang de l’année',
      yLabel: 'Chiffre d’affaires (k€)',
      xRange: [0, 7],
      yRange: [550, 900],
      points: CA_RIVAGE.map((ca, rang) => ({
        x: rang + 1,
        y: ca,
        label: String(ANNEES_RIVAGE[rang]),
      })),
      reading:
        'Les six points montent presque en ligne droite : le chiffre d’affaires augmente chaque année.',
      source: 'Données fictives Atelier Rivage, créées pour ce cours.',
      description:
        'Nuage de six points : en abscisse les rangs 1 à 6, des années 2020 à 2025 ; en ordonnée le chiffre d’affaires, de 610 à 826 milliers d’euros. Les points montent régulièrement, presque alignés.',
    },
  ),
  {
    screenId: 'B2-02-A2-02-VOTE-CORRELATION',
    titre: 'Vote : deux séries qui montent ensemble',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['correlation'],
    notes: moteur.puces(
      'Temps « réfléchir » de la notion 2 : vote non noté.',
      'Vote 1 individuel ; entre 30 et 70 % de bonnes réponses, débat en binôme puis revote ; sinon, revote directement.',
      'Papier : vote à main levée, puis revote après discussion en binôme.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-02-a2-glaces',
          'correlation',
          false,
          'Mois par mois, les ventes de voiles d’Atelier Rivage et celles du glacier voisin montent et descendent ensemble. Que peut-on conclure ?',
          'Rien sur une cause : la saison fait varier les deux ventes',
          [
            [
              'Les glaces font vendre des voiles',
              'correlation-prise-pour-causalite',
            ],
            [
              'Les voiles font vendre des glaces',
              'correlation-prise-pour-causalite',
            ],
          ],
          ['saison'],
        ),
        moteur.vote(
          'b2-02-a2-formation',
          'correlation',
          false,
          'De 2020 à 2025, les heures de formation des salariés d’Atelier Rivage et son chiffre d’affaires ont augmenté ensemble. Hélène conclut : « la formation fait notre chiffre d’affaires ». Que lui répondre ?',
          'Les deux séries suivent le temps : leur lien ne prouve pas une cause',
          [
            [
              'Elle a raison : les deux séries montent ensemble',
              'correlation-prise-pour-causalite',
            ],
            [
              'Elle a raison si le lien entre les séries est très fort',
              'correlation-prise-pour-causalite',
            ],
          ],
          ['temps'],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Deux séries liées ne prouvent pas une cause',
        lignes: [
          'Voiles et glaces : la saison fait varier les deux ventes à la fois.',
          'Formation et chiffre d’affaires : les deux séries augmentent avec le temps, pour bien d’autres raisons.',
          'Une corrélation mesure l’alignement de deux séries, pas ce qui cause leurs variations.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A2-03-COURS-NUAGE',
      titre: 'Cours : nuage de points, point moyen, corrélation',
      diffusion: 'catalogue',
      dureeMinutes: 6,
      concepts: ['nuage-de-points', 'correlation'],
      notes: moteur.puces(
        'Trace écrite : 6 min au plus.',
        'Faire dire la différence entre le point moyen et le point du milieu du tableau.',
      ),
    },
    'lesson',
    {
      title: 'Nuage de points, point moyen, corrélation',
      subtitle: 'Trace écrite · notion 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Série à deux variables et nuage de points',
          text: 'On observe deux caractères x et y aux mêmes dates ou sur les mêmes individus. Chaque couple (xᵢ ; yᵢ) donne un point ; l’ensemble des points forme le nuage.',
        },
        {
          kind: 'definition',
          title: 'Le point moyen',
          text: 'Le point moyen G a pour abscisse la moyenne des xᵢ et pour ordonnée la moyenne des yᵢ. Ce n’est pas le point du milieu du tableau.',
          formula: 'G(x̄ ; ȳ)',
        },
        {
          kind: 'property',
          title: 'Le coefficient de corrélation linéaire r',
          text: 'r est compris entre −1 et 1. Plus |r| est proche de 1, plus les points sont proches d’une droite ; le signe de r dit seulement si cette droite monte ou descend. r n’est pas la pente de la droite.',
          formula:
            '−1 ≤ r ≤ 1 · =COEFFICIENT.CORRELATION(plage des x;plage des y)',
        },
        {
          kind: 'property',
          title: 'Corrélation n’est pas causalité',
          text: 'Deux séries peuvent évoluer ensemble parce qu’une troisième variable, la saison ou le temps, les fait varier toutes les deux. Un |r| proche de 1 autorise un ajustement affine, jamais une conclusion sur une cause.',
        },
      ],
    },
  ),
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A2-04-CORRECTION',
      titre: 'Correction : publicité et commandes',
      dureeMinutes: 2,
      concepts: ['nuage-de-points', 'correlation'],
      notes: moteur.puces(
        'S’arrêter sur le point moyen (étape 2) et sur la prudence (étape 5).',
        'Transition : « À vous, sur Atelier Rivage : exercice 2. »',
      ),
    },
    {
      screenId: 'B2-02-A2-04-EXEMPLE-NUAGE',
      titre: 'Exemple guidé : publicité et commandes',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 5,
      concepts: ['nuage-de-points', 'correlation'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-02-a2-exemple-nuage',
          enonce:
            'Sur quatre mois, Atelier Rivage a dépensé x centaines d’euros de publicité en ligne et reçu y commandes : x = 2 ; 4 ; 6 ; 8 et y = 11 ; 15 ; 20 ; 22.',
          etapes: [
            {
              id: 'nuage',
              intitule: 'Placer le nuage',
              raisonnement:
                'Quatre points : (2 ; 11), (4 ; 15), (6 ; 20), (8 ; 22). Ils montent de gauche à droite.',
              invite: 'Quels sont les quatre points du nuage ?',
            },
            {
              id: 'point-moyen',
              intitule: 'Le point moyen',
              raisonnement:
                'x̄ = (2 + 4 + 6 + 8) ÷ 4 = 5 ; ȳ = (11 + 15 + 20 + 22) ÷ 4 = 17. G(5 ; 17). Le point du milieu du tableau n’existe pas ici : quatre colonnes.',
              invite: 'Quelles sont les coordonnées du point moyen G ?',
            },
            {
              id: 'r',
              intitule: 'Le coefficient de corrélation',
              raisonnement:
                'À la calculatrice ou au tableur : r ≈ 0,988. Il est très proche de 1 : les points sont presque alignés sur une droite qui monte.',
              invite: 'Que vaut r, arrondi au millième ?',
            },
            {
              id: 'lecture',
              intitule: 'Lire r',
              raisonnement:
                'r proche de 1 justifie un ajustement affine. r n’est pas la pente : il ne dit pas combien de commandes rapporte une centaine d’euros.',
              invite: 'Que permet de dire un r aussi proche de 1 ?',
            },
            {
              id: 'prudence',
              intitule: 'Et la cause ?',
              raisonnement:
                'Les commandes ont pu augmenter avec la saison, en même temps que la publicité. La corrélation seule ne prouve pas que la publicité les a causées.',
              invite: 'La publicité est-elle la cause des commandes ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-02-A2-05-ATELIER-NUAGE',
    titre: 'Exercice 2 — Le nuage d’Atelier Rivage',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 9,
    concepts: ['nuage-de-points', 'correlation'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 7 min',
      'Réflexion : relire la trace écrite et repérer la touche de r sur la calculatrice.',
      'Pièges : les sommes au lieu des moyennes ; le point du milieu du tableau ; r lu comme la hausse annuelle.',
      'Papier : exercice 2 du livret.',
    ),
    proprietes: {
      intitule: 'Exercice 2 — Le nuage d’Atelier Rivage',
      consigne: CONSIGNE_DE_RIVAGE,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a2-x-moyen',
          'nuage-de-points',
          'Quelle est l’abscisse x̄ du point moyen G ?',
          null,
          3.5,
          { type: 'absolue', valeur: 0.01 },
          '3,5',
          [[21, 'point-moyen-confondu']],
        ),
        moteur.numerique(
          'b2-02-a2-y-moyen',
          'nuage-de-points',
          'Quelle est l’ordonnée ȳ du point moyen G, en milliers d’euros ?',
          'k€',
          718,
          { type: 'absolue', valeur: 0.5 },
          '718',
          [
            [715, 'point-moyen-confondu'],
            [4308, 'point-moyen-confondu'],
          ],
        ),
        moteur.numerique(
          'b2-02-a2-r',
          'correlation',
          'Quel est le coefficient de corrélation linéaire r entre x et y ? Arrondir au millième.',
          null,
          0.999055,
          { type: 'decimales', valeur: 3 },
          '0,999',
          [[43.885714, 'correlation-lue-comme-pente']],
        ),
        moteur.vote(
          'b2-02-a2-lecture-r',
          'correlation',
          true,
          'Hélène demande : peut-on résumer la tendance du chiffre d’affaires par une droite ?',
          'Oui : r est très proche de 1, les points sont presque alignés',
          [
            [
              'Oui, et r prouve que les hausses de tarifs causent cette croissance',
              'correlation-prise-pour-causalite',
            ],
            [
              'Non : r devrait être égal à la hausse annuelle du chiffre d’affaires',
              'correlation-lue-comme-pente',
            ],
          ],
          ['r est très proche de 1'],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A2-05-CORRECTION',
      titre: 'Correction de l’exercice 2',
      dureeMinutes: 2,
      concepts: ['nuage-de-points', 'correlation'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie.',
        'Transition : « Vérifions G autrement : les écarts au point moyen. »',
      ),
    },
    'B2-02-A2-05-ATELIER-NUAGE',
    [
      [
        'b2-02-a2-x-moyen',
        'x̄ = (1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 = 3,5. La somme 21 n’est pas une coordonnée.',
      ],
      [
        'b2-02-a2-y-moyen',
        'ȳ = 4 308 ÷ 6 = 718 k€. La demi-somme des deux valeurs du milieu, 715, n’est pas la moyenne.',
      ],
      [
        'b2-02-a2-r',
        'r ≈ 0,999 : les six points sont presque alignés. La hausse annuelle du chiffre d’affaires est la pente de la droite, calculée à l’acte 3 : ce n’est pas r.',
      ],
      [
        'b2-02-a2-lecture-r',
        'Un r aussi proche de 1 justifie un ajustement affine. Il ne dit rien de ce qui cause la croissance.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A2-06-ECARTS-POINT-MOYEN',
    titre: 'Exercice 3 — Les écarts au point moyen',
    diffusion: 'seance',
    brique: 'fp-table-build',
    dureeMinutes: 10,
    concepts: ['nuage-de-points'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 8 min',
      'Réflexion : prévoir le signe des écarts de la première et de la dernière année.',
      'Piège : l’écart au rang du milieu du tableau au lieu de x̄.',
      'Contrôle à faire dire : les écarts d’une colonne ont une somme nulle.',
      'Papier : tableau du livret.',
    ),
    proprietes: {
      modalite: 'solo',
      plan: {
        id: 'b2-02-a2-ecarts-point-moyen',
        intitule: 'Les écarts au point moyen',
        consignes: [
          'Rappel de l’exercice 2 : x̄ = 3,5 et ȳ = 718 k€.',
          'Pour chaque année, écrivez l’écart du rang à x̄, puis l’écart du chiffre d’affaires à ȳ.',
          'Comparez les signes des deux écarts sur chaque ligne.',
        ],
        echeances: ANNEES_RIVAGE.length,
        libellesLignes: ANNEES_RIVAGE.map(String),
        parametres: {},
        colonnes: [
          {
            cle: 'rang',
            intitule: 'Rang xᵢ',
            role: 'donnee',
            valeurs: ANNEES_RIVAGE.map((_, rang) => rang + 1),
            decimales: 0,
            totalise: false,
          },
          {
            cle: 'ca',
            intitule: 'Chiffre d’affaires yᵢ (k€)',
            role: 'donnee',
            valeurs: [...CA_RIVAGE],
            decimales: 0,
            totalise: false,
          },
          {
            cle: 'ecartX',
            intitule: 'xᵢ − x̄',
            role: 'saisie',
            decimales: 1,
            totalise: false,
          },
          {
            cle: 'ecartY',
            intitule: 'yᵢ − ȳ (k€)',
            role: 'saisie',
            decimales: 0,
            totalise: false,
          },
        ],
        synthese: [],
      },
      questions: [
        moteur.questionDeTableau(
          'b2-02-a2-ecarts-point-moyen',
          'nuage-de-points',
          [PREMIER_ECART, ...AUTRES_ECARTS],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A2-06-CORRECTION',
      titre: 'Correction de l’exercice 3',
      dureeMinutes: 2,
      concepts: ['nuage-de-points'],
      notes: moteur.puces(
        'Faire lire les signes : négatifs ensemble avant G, positifs ensemble après.',
        'Transition : jalon 2.',
      ),
    },
    'B2-02-A2-06-ECARTS-POINT-MOYEN',
    [
      [
        'b2-02-a2-ecarts-point-moyen',
        'Écarts des rangs : −2,5 ; −1,5 ; −0,5 ; 0,5 ; 1,5 ; 2,5. Écarts du chiffre d’affaires : −108 ; −66 ; −24 ; 18 ; 72 ; 108. Chaque colonne a une somme nulle, et les deux écarts ont toujours le même signe : les points sont en bas à gauche et en haut à droite de G, d’où r positif.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A2-07-JALON',
    titre: 'Jalon 2 : relier deux variables',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['correlation'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A2-03 sur le point moyen.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a2-jalon',
        invite:
          'Je sais placer le point moyen, calculer r et dire ce qu’il ne prouve pas.',
      },
    },
  },
];

const ACTE_3: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A3-01-JUSQU-OU',
      titre: 'Réfléchir : jusqu’où prolonger une tendance ?',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['prevision'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 3 : 3 min d’écriture, puis lire trois réponses.',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-02-a3-jusqu-ou',
        type: 'reflection',
        question:
          'La banque veut le chiffre d’affaires de 2028. Quelle droite traceriez-vous dans le nuage d’Atelier Rivage, et jusqu’à quelle année vous fieriez-vous à elle ?',
        placeholder: 'Je tracerais… Je m’y fierais jusqu’à… parce que…',
        competency: 'Raisonner · juger la portée d’une prévision',
      },
    },
    {
      correction: {
        expected:
          'Une droite qui passe au plus près de tous les points, et donc par le point moyen. Près des données, la prévision est solide ; plus on s’en éloigne, plus elle suppose que la tendance continue.',
        nextAction:
          'Gardez votre réponse : la trace écrite donne la droite et la règle pour prévoir.',
      },
      renvoi: 'B2-02-A2-01-NUAGE-RIVAGE',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-02-A3-02-COURS-DROITE',
      titre: 'Cours : la droite des moindres carrés et la prévision',
      diffusion: 'catalogue',
      dureeMinutes: 6,
      concepts: ['ajustement-affine', 'prevision'],
      notes: moteur.puces(
        'Trace écrite : 6 min au plus.',
        'Insister : x est le rang de l’année, jamais l’année.',
      ),
    },
    'lesson',
    {
      title: 'La droite des moindres carrés et la prévision',
      subtitle: 'Trace écrite · notion 3',
      blocks: [
        {
          kind: 'definition',
          title: 'La droite des moindres carrés',
          text: 'C’est la droite y = ax + b qui rend minimale la somme des carrés des écarts verticaux entre les points et la droite. Elle passe toujours par le point moyen G.',
          formula: 'a = cov(x, y) ÷ V(x) · b = ȳ − a x̄',
          steps: [
            'a : =PENTE(plage des y;plage des x)',
            'b : =ORDONNEE.ORIGINE(plage des y;plage des x)',
            'Contrôle : a x̄ + b redonne ȳ.',
          ],
        },
        {
          kind: 'method',
          title: 'Prévoir avec la droite',
          text: 'Remplacer x par le rang de l’année, jamais par l’année elle-même. Entre les rangs observés, on interpole ; au-delà, on extrapole : la prévision suppose que la tendance continue et devient fragile loin des données.',
          formula: 'rang = année − année du rang 1 + 1',
        },
        {
          kind: 'method',
          title: 'Trouver l’année d’un seuil',
          text: 'Résoudre ax + b ≥ seuil, puis prendre le premier rang entier qui convient, c’est-à-dire l’entier supérieur, et le traduire en année.',
        },
        {
          kind: 'exam',
          title: 'Rédiger au CCF',
          text: 'Donner l’équation avec ses arrondis, la valeur de r et sa lecture, la prévision avec son unité, puis la réserve : « si la tendance observée se poursuit ».',
        },
      ],
    },
  ),
  ...moteur.suiviDeSonCorrige(
    {
      screenId: 'B2-02-A3-03-CORRECTION',
      titre: 'Correction : la droite de la publicité',
      dureeMinutes: 2,
      concepts: ['ajustement-affine', 'prevision'],
      notes: moteur.puces(
        'S’arrêter sur le contrôle par G (étape 3) et sur l’arrondi du seuil (étape 5).',
        'Transition : « À vous, sur Atelier Rivage : exercice 4. »',
      ),
    },
    {
      screenId: 'B2-02-A3-03-EXEMPLE-DROITE',
      titre: 'Exemple guidé : la droite de la publicité',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 6,
      concepts: ['ajustement-affine', 'prevision'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-02-a3-exemple-droite',
          enonce:
            'Même série que l’exemple de la notion 2 : publicité x = 2 ; 4 ; 6 ; 8 (centaines d’euros), commandes y = 11 ; 15 ; 20 ; 22. Hélène veut 30 commandes par mois.',
          etapes: [
            {
              id: 'pente',
              intitule: 'Le coefficient directeur',
              raisonnement:
                'À la calculatrice ou avec PENTE : a = 1,9. Chaque centaine d’euros de publicité va avec 1,9 commande de plus, en moyenne sur la série.',
              invite: 'Que vaut a ?',
            },
            {
              id: 'ordonnee',
              intitule: 'L’ordonnée à l’origine',
              raisonnement:
                'b = ȳ − a x̄ = 17 − 1,9 × 5 = 7,5. Droite : y = 1,9x + 7,5.',
              invite: 'Que vaut b ?',
            },
            {
              id: 'controle',
              intitule: 'Contrôler par le point moyen',
              raisonnement:
                '1,9 × 5 + 7,5 = 17 : la droite passe bien par G(5 ; 17).',
              invite: 'Comment vérifier la droite sans refaire le calcul ?',
            },
            {
              id: 'prevision',
              intitule: 'Prévoir',
              raisonnement:
                'Pour 1 000 € de publicité, x = 10 : y = 1,9 × 10 + 7,5 = 26,5, soit environ 26 à 27 commandes. x = 10 est hors des données observées : c’est une extrapolation.',
              invite:
                'Combien de commandes prévoir pour 1 000 € de publicité ?',
            },
            {
              id: 'seuil',
              intitule: 'Le seuil de 30 commandes',
              raisonnement:
                '1,9x + 7,5 ≥ 30 donne x ≥ 22,5 ÷ 1,9 ≈ 11,84. Premier entier : 12, soit 1 200 € de publicité. Arrondir à 11 ne suffirait pas.',
              invite:
                'À partir de quel budget la droite prévoit-elle 30 commandes ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-02-A3-04-ATELIER-DROITE',
    titre: 'Exercice 4 — Prévoir le chiffre d’affaires',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 9,
    concepts: ['ajustement-affine', 'prevision'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 7 min',
      'Réflexion : écrire le rang de 2028 avant tout calcul.',
      'Pièges : séries inversées dans PENTE ; 2028 à la place du rang ; seuil arrondi à l’entier inférieur.',
      'Papier : exercice 4 du livret.',
    ),
    proprietes: {
      renvoi: 'B2-02-A2-01-NUAGE-RIVAGE',
      intitule: 'Exercice 4 — Prévoir le chiffre d’affaires',
      consigne: `${CONSIGNE_DE_RIVAGE} Utiliser les coefficients non arrondis pour les prévisions.`,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        moteur.numerique(
          'b2-02-a3-pente',
          'ajustement-affine',
          'Quel est le coefficient directeur a de la droite des moindres carrés de y en x ? Arrondir au centième.',
          null,
          43.885714,
          moteur.DEUX_DECIMALES,
          '43,89',
          [
            [0.022743, 'pente-ordonnee-inversees'],
            [564.4, 'pente-ordonnee-inversees'],
          ],
        ),
        moteur.numerique(
          'b2-02-a3-ordonnee',
          'ajustement-affine',
          'Quelle est l’ordonnée à l’origine b de cette droite ? Arrondir au centième.',
          null,
          564.4,
          moteur.DEUX_DECIMALES,
          '564,4',
          [[43.885714, 'pente-ordonnee-inversees']],
        ),
        moteur.numerique(
          'b2-02-a3-prevision',
          'prevision',
          'Si la tendance se poursuit, quel chiffre d’affaires prévoir pour 2028 ? Réponse en milliers d’euros, arrondie à l’unité.',
          'k€',
          959.371429,
          { type: 'absolue', valeur: 0.5 },
          '959',
          [[89564.628571, 'rang-pris-pour-annee']],
        ),
        moteur.numerique(
          'b2-02-a3-seuil',
          'prevision',
          'Selon ce modèle, en quelle année le chiffre d’affaires dépasserait-il 1 000 k€ pour la première fois ?',
          null,
          2029,
          moteur.TOLERANCE_NULLE,
          '2029',
          [[2028, 'seuil-mal-arrondi']],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A3-04-CORRECTION',
      titre: 'Correction de l’exercice 4',
      dureeMinutes: 2,
      concepts: ['ajustement-affine', 'prevision'],
      notes: moteur.puces(
        'Commencer par la question la moins réussie.',
        'Transition : « Une IA a fait la même prévision, pour 2035. »',
      ),
    },
    'B2-02-A3-04-ATELIER-DROITE',
    [
      [
        'b2-02-a3-pente',
        '=PENTE(plage des y;plage des x) ≈ 43,89 : le chiffre d’affaires augmente d’environ 43,89 k€ par an. Inverser les deux plages donne 0,02, sans signification ici.',
      ],
      [
        'b2-02-a3-ordonnee',
        'b = 718 − 43,885714 × 3,5 = 564,4. Contrôle : la droite passe par G(3,5 ; 718).',
      ],
      [
        'b2-02-a3-prevision',
        '2028 a le rang 9 : y ≈ 43,885714 × 9 + 564,4 ≈ 959 k€, si la tendance se poursuit. Avec x = 2028, on obtient 89 565 k€, absurde.',
      ],
      [
        'b2-02-a3-seuil',
        '43,885714x + 564,4 ≥ 1 000 donne x ≥ 9,93. Premier rang entier : 10, soit 2029. Le rang 9 (2028) donne 959 k€, sous le seuil.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A3-05-DEFI-IA',
    titre: 'Exercice 5 — Corriger la prévision d’une IA',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 8,
    concepts: ['prevision', 'correlation'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 6 min',
      'Réflexion : relire la trace écrite A3-02 et la règle du rang.',
      'Repérer qui trouve le rang, l’extrapolation et la causalité ; faire trouver la piste fausse avant de révéler.',
      'Papier : exercice 5 du livret.',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-02-a3-defi-ia',
        enonce:
          'Samir a demandé une prévision pour 2035 à un assistant IA. Réponse : « Droite : y = 43,89x + 564,4. En 2035, y = 43,89 × 2035 + 564,4 ≈ 89 881 k€. Comme r est proche de 1, ce sont nos hausses de tarifs qui causent la croissance. »',
        invite:
          'Trouvez les erreurs de l’IA, corrigez la prévision et écrivez la réserve à ajouter.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          moteur.strategie(
            'rang',
            'Remplacer x par le rang de 2035, 16, et non par 2035 : y ≈ 43,89 × 16 + 564,4 ≈ 1 267 k€.',
          ),
          moteur.strategie(
            'loin',
            '2035 est à dix ans des données : l’extrapolation suppose que la tendance dure, la prévision est très fragile.',
          ),
          moteur.strategie(
            'causalite',
            'r proche de 1 dit que les points sont alignés, pas ce qui cause la hausse : aucune conclusion sur les tarifs.',
          ),
          moteur.strategie(
            'controle',
            'Contrôler la droite par le point moyen : 43,89 × 3,5 + 564,4 ≈ 718, l’ordonnée de G.',
          ),
          moteur.strategie(
            'garder',
            'Garder la réponse : r est proche de 1, donc la prévision est sûre.',
            true,
          ),
        ],
      },
      renvoi: 'B2-02-A2-01-NUAGE-RIVAGE',
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A3-05-CORRECTION',
      titre: 'Correction de l’exercice 5',
      dureeMinutes: 2,
      concepts: ['prevision', 'correlation'],
      notes: moteur.puces(
        'Faire lire deux réserves écrites par la classe.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ),
    },
    'B2-02-A3-05-DEFI-IA',
    [
      [
        'rang',
        'L’IA a remplacé x par l’année : avec le rang 16, on prévoit environ 1 267 k€, pas 89 881.',
      ],
      [
        'loin',
        'Dix ans au-delà des données, rien ne garantit que la tendance tienne : la prévision doit porter sa réserve.',
      ],
      [
        'causalite',
        'Le coefficient de corrélation mesure l’alignement ; il ne prouve aucune cause.',
      ],
      [
        'controle',
        'Une droite des moindres carrés passe toujours par G : c’est le contrôle le plus rapide.',
      ],
      [
        'garder',
        'Piste fausse : un r proche de 1 dit que le passé est bien résumé, pas que l’avenir le suivra.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A3-06-JALON',
    titre: 'Jalon 3 : prévoir avec une droite',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['prevision'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-02-a3-jalon',
        invite:
          'Je sais obtenir la droite des moindres carrés, prévoir avec le rang et trouver l’année d’un seuil.',
      },
    },
  },
];

const PREMIERE_LIGNE_FIBRE = 2;
const DERNIERE_LIGNE_FIBRE = PREMIERE_LIGNE_FIBRE + ANNEES_FIBRE.length - 1;
const PLAGE_DES_RANGS = `A${PREMIERE_LIGNE_FIBRE}:A${DERNIERE_LIGNE_FIBRE}`;
const PLAGE_DE_LA_FIBRE = `B${PREMIERE_LIGNE_FIBRE}:B${DERNIERE_LIGNE_FIBRE}`;

function cellulesDeLaFibre(): Record<string, string> {
  return Object.fromEntries(
    ANNEES_FIBRE.flatMap((annee, rang) => {
      const ligne = PREMIERE_LIGNE_FIBRE + rang;
      return [
        [`A${ligne}`, String(rang + 1)],
        [`B${ligne}`, FIBRE_EN_MILLIONS[rang]],
        [`C${ligne}`, String(annee)],
      ];
    }),
  );
}

const INDICATEURS_DE_LA_FIBRE = [
  ['D2', 'Coefficient de corrélation r'],
  ['D3', 'Coefficient directeur a'],
  ['D4', 'Ordonnée à l’origine b'],
  ['D5', 'x̄'],
  ['D6', 'ȳ'],
  ['D7', 'Contrôle : la droite passe par G'],
] as const;

const PLAN_FEUILLE = {
  id: 'b2-02-a4-feuille-fibre',
  intitule: 'Question tableur — Ajuster la série de la fibre',
  lignes: 7,
  colonnes: 5,
  cellules: {
    A1: 'Rang x',
    B1: 'Abonnements y (millions)',
    C1: 'Année',
    D1: 'Indicateur',
    E1: 'Valeur',
    ...cellulesDeLaFibre(),
    ...Object.fromEntries(INDICATEURS_DE_LA_FIBRE),
  },
  verrouillees: [
    'A1',
    'B1',
    'C1',
    'D1',
    'E1',
    ...Object.keys(cellulesDeLaFibre()),
    ...INDICATEURS_DE_LA_FIBRE.map(([reference]) => reference),
  ],
  consignes: [
    `En E2, calculez r avec COEFFICIENT.CORRELATION(${PLAGE_DES_RANGS};${PLAGE_DE_LA_FIBRE}).`,
    'En E3 et E4, calculez a et b avec PENTE et ORDONNEE.ORIGINE : la plage des y d’abord, celle des x ensuite.',
    'En E5 et E6, calculez les coordonnées du point moyen G avec MOYENNE.',
    'En E7, contrôlez : =SI(ARRONDI(E3*E5+E4-E6;6)=0;1;0) doit afficher 1.',
  ],
};

const PARCOURS_DU_COFFRE = 'b2-02-a4-coffre-fibre';

const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-01-SITUATION-FIBRE',
      titre: 'Mini-situation CCF : la fibre optique en France',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['nuage-de-points', 'prevision'],
      notes: moteur.puces(
        'Conditions du CCF : 25 min, calculatrice, poste individuel ; la question tableur vaut 3 points sur 10.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : la fibre optique en France',
      subtitle:
        'Nombre d’abonnements internet en fibre optique jusqu’à l’abonné en France, en fin d’année, en millions. Le rang x vaut 1 pour 2020.',
      columns: [
        { key: 'annee', label: 'Année' },
        { key: 'rang', label: 'Rang x' },
        { key: 'abonnements', label: 'Abonnements y (millions)' },
      ],
      rows: ANNEES_FIBRE.map((annee, rang) => ({
        annee: String(annee),
        rang: String(rang + 1),
        abonnements: FIBRE_EN_MILLIONS[rang],
      })),
      note: 'Source : Arcep, Observatoire des marchés des communications électroniques en France, résultats des quatrièmes trimestres 2020 à 2024. Données publiques réutilisables.',
      sourceLink: {
        href: 'https://www.arcep.fr/cartes-et-donnees/nos-publications-chiffrees/observatoire-des-marches-des-communications-electroniques-en-france/t4-2024.html',
        label: 'Arcep · observatoire du quatrième trimestre 2024',
      },
    },
  ),
  {
    screenId: 'B2-02-A4-02-TABLEUR-FIBRE',
    titre: 'Question tableur (3 points sur 10) : ajuster la série',
    diffusion: 'seance',
    brique: 'fp-sheet',
    dureeMinutes: 15,
    concepts: ['correlation', 'ajustement-affine'],
    notes: moteur.puces(
      'Temps : réflexion 3 min · travail 12 min',
      'Réflexion : chacun écrit sur papier les fonctions à utiliser et l’ordre des plages.',
      'Erreurs à chercher : plages inversées dans PENTE ; valeurs tapées à la main au lieu de formules.',
      'Papier : même question à la calculatrice, formules écrites sur la copie ; en CCF, elle se fait devant l’examinateur.',
    ),
    proprietes: {
      modalite: 'solo',
      plan: PLAN_FEUILLE,
      questions: [
        {
          type: 'feuille',
          id: 'b2-02-a4-feuille-fibre',
          concept: 'ajustement-affine',
          noteCompte: true,
          corrige: {
            type: 'feuille',
            plan: PLAN_FEUILLE,
            attendus: [
              moteur.attendu(
                'E2',
                `=COEFFICIENT.CORRELATION(${PLAGE_DES_RANGS};${PLAGE_DE_LA_FIBRE})`,
                0.997852,
                'references',
              ),
              moteur.attendu(
                'E3',
                `=PENTE(${PLAGE_DE_LA_FIBRE};${PLAGE_DES_RANGS})`,
                3.51,
                'references',
                [[0.283678, 'pente-ordonnee-inversees']],
              ),
              moteur.attendu(
                'E4',
                `=ORDONNEE.ORIGINE(${PLAGE_DE_LA_FIBRE};${PLAGE_DES_RANGS})`,
                7.21,
                'references',
                [[-2.032441, 'pente-ordonnee-inversees']],
              ),
              moteur.attendu(
                'E5',
                `=MOYENNE(${PLAGE_DES_RANGS})`,
                3,
                'references',
              ),
              moteur.attendu(
                'E6',
                `=MOYENNE(${PLAGE_DE_LA_FIBRE})`,
                17.74,
                'references',
                [[3, 'point-moyen-confondu']],
              ),
              moteur.controle('E7', '=SI(ARRONDI(E3*E5+E4-E6;6)=0;1;0)'),
            ],
            seuilReussite: 0.8,
          },
        },
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A4-02-CORRECTION',
      titre: 'Correction de la question tableur',
      dureeMinutes: 2,
      concepts: ['correlation', 'ajustement-affine'],
      notes: moteur.puces(
        'Projeter la feuille d’un poste volontaire et relire chaque formule.',
        'Transition : « Avec cette droite, prévoyez : le coffre de la mini-situation. »',
      ),
    },
    'B2-02-A4-02-TABLEUR-FIBRE',
    [
      [
        'E2',
        `=COEFFICIENT.CORRELATION(${PLAGE_DES_RANGS};${PLAGE_DE_LA_FIBRE}) ≈ 0,998 : les points sont presque alignés, un ajustement affine est justifié.`,
      ],
      [
        'E3 et E4',
        `=PENTE(${PLAGE_DE_LA_FIBRE};${PLAGE_DES_RANGS}) = 3,51 et =ORDONNEE.ORIGINE(${PLAGE_DE_LA_FIBRE};${PLAGE_DES_RANGS}) = 7,21 : y = 3,51x + 7,21. Plages inversées : 0,28, la pente de x en y.`,
      ],
      [
        'E5 à E7',
        'G(3 ; 17,74) ; 3,51 × 3 + 7,21 = 17,74 : le contrôle affiche 1.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A4-03-COFFRE-FIBRE',
    titre: 'Mini-situation : prévoir et juger la prévision',
    diffusion: 'seance',
    brique: 'fp-escape',
    dureeMinutes: 14,
    concepts: ['prevision'],
    notes: moteur.puces(
      'Temps : réflexion 2 min · travail 12 min',
      'Réflexion : écrire les rangs de 2025 et de 2030 avant d’ouvrir le coffre.',
      'Indices disponibles après 60 s. À 10 min, projeter l’énigme la moins résolue.',
      'Papier : quatre questions rédigées du livret, sans code de coffre.',
    ),
    proprietes: {
      modalite: 'solo',
      parcours: {
        id: PARCOURS_DU_COFFRE,
        intitule:
          'Prévoir et juger la prévision : quatre réponses pour ouvrir le coffre',
        delaiIndiceMs: 60000,
        budgetEnigmeMs: 150000,
        tentativesMax: 10,
        enigmes: [
          {
            id: 'b2-02-a4-e1-prevision',
            intitule: 'La prévision de fin 2025',
            enonce:
              'Avec la droite y = 3,51x + 7,21, quel nombre d’abonnements à la fibre prévoir pour fin 2025, en millions ? Arrondir au centième.',
            indice: 'Remplacez x par le rang de l’année, pas par l’année.',
          },
          {
            id: 'b2-02-a4-e2-seuil',
            intitule: 'L’année des 35 millions',
            enonce:
              'Selon ce modèle, en quelle année le nombre d’abonnements dépasserait-il 35 millions pour la première fois ?',
            indice:
              'Résolvez l’inéquation, prenez le premier rang entier, puis traduisez-le en année.',
          },
          {
            id: 'b2-02-a4-e3-lointaine',
            intitule: 'Une prévision lointaine',
            enonce:
              'Quel nombre d’abonnements le modèle prévoit-il pour fin 2030, en millions ? Arrondir au centième.',
            indice:
              'Même méthode que pour la première énigme, avec le rang de la nouvelle année.',
          },
          {
            id: 'b2-02-a4-e4-ralentissement',
            intitule: 'Le modèle face au réel',
            enonce:
              'L’Arcep a publié depuis le chiffre réel : la fibre a gagné 2,7 millions d’abonnements en 2025. De combien de millions la hausse annuelle prévue par le modèle dépasse-t-elle cette hausse observée ? Arrondir au centième.',
            indice:
              'Le modèle ajoute chaque année la même quantité : son coefficient directeur.',
          },
        ],
      },
      questions: [
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          0,
          'b2-02-a4-e1-prevision',
          'prevision',
          28.27,
          0.005,
          '28,27',
          'F7',
          [
            [7114.96, 'rang-pris-pour-annee'],
            [46.77, 'pente-ordonnee-inversees'],
          ],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          1,
          'b2-02-a4-e2-seuil',
          'prevision',
          2027,
          0.05,
          '2027',
          'B3',
          [[2026, 'seuil-mal-arrondi']],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          2,
          'b2-02-a4-e3-lointaine',
          'prevision',
          45.82,
          0.005,
          '45,82',
          'R9',
          [[7132.51, 'rang-pris-pour-annee']],
        ),
        moteur.enigme(
          PARCOURS_DU_COFFRE,
          3,
          'b2-02-a4-e4-ralentissement',
          'prevision',
          0.81,
          0.005,
          '0,81',
          'E5',
          [[2.7, 'extrapolation-sans-reserve']],
        ),
      ],
    },
  },
  moteur.correctionDesReponses(
    {
      screenId: 'B2-02-A4-03-CORRECTION',
      titre: 'Correction de la mini-situation',
      dureeMinutes: 2,
      concepts: ['prevision'],
      notes: moteur.puces(
        'S’attarder sur l’énigme la moins résolue (pupitre).',
        'Finir sur la comparaison au réel : c’est la réserve à écrire au CCF.',
      ),
    },
    'B2-02-A4-03-COFFRE-FIBRE',
    [
      [
        'b2-02-a4-e1-prevision',
        'Fin 2025 a le rang 6 : 3,51 × 6 + 7,21 = 28,27 millions. Avec x = 2025, on trouve 7 114,96 millions, absurde.',
      ],
      [
        'b2-02-a4-e2-seuil',
        '3,51x + 7,21 ≥ 35 donne x ≥ 7,92. Premier rang entier : 8, soit 2027.',
      ],
      [
        'b2-02-a4-e3-lointaine',
        'Fin 2030 a le rang 11 : 3,51 × 11 + 7,21 = 45,82 millions, une extrapolation six ans au-delà des données.',
      ],
      [
        'b2-02-a4-e4-ralentissement',
        'Le modèle ajoute 3,51 millions par an ; la fibre en a gagné 2,7 en 2025 : 0,81 de trop. Le réel, 27,1 millions, est 1,17 million sous la prévision : la croissance ralentit, la droite ne le voit pas.',
      ],
    ],
  ),
  {
    screenId: 'B2-02-A4-04-RAPPEL',
    titre: 'Rappel : de mémoire, sans vos notes',
    diffusion: 'seance',
    brique: 'fp-spaced',
    dureeMinutes: 6,
    concepts: [...CONCEPTS_DU_COURS],
    notes: moteur.puces(
      '5 min individuelles, puis projeter la carte de maîtrise.',
      'Tous reçoivent les deux questions obligatoires (causalité, rang), en plus de leurs points faibles.',
    ),
    proprietes: {
      rappel: {
        id: 'b2-02-a4-rappel',
        intitule: 'Rappel : de mémoire, sans vos notes',
      },
      banque: {
        questions: [
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
            'b2-02-r-extreme',
            'choix-du-resume',
            'Une facture contestée étire fortement la série. Que faites-vous ?',
            'La garder, la signaler et donner la médiane avec la moyenne',
            [
              ['La retirer sans le dire', 'valeur-extreme-supprimee'],
              ['Donner la moyenne seule', 'valeur-extreme-ignoree'],
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
            'On a relevé les délais de tous les clients de l’année. Quelle fonction d’écart-type utiliser ?',
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
            'b2-02-r-etendue',
            'dispersion',
            'Deux séries ont la même étendue. Ont-elles la même dispersion ?',
            'Pas forcément : l’étendue ne regarde que les deux extrêmes',
            [
              ['Oui, toujours', 'etendue-prise-pour-dispersion'],
              [
                'Oui, si elles ont aussi la même médiane',
                'etendue-prise-pour-dispersion',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-point-moyen',
            'nuage-de-points',
            'Rangs 1, 2, 3, 4 et valeurs 10, 20, 30, 60. Quelles sont les coordonnées du point moyen ?',
            '(2,5 ; 30), les deux moyennes',
            [
              [
                '(2 ; 20), le point du milieu du tableau',
                'point-moyen-confondu',
              ],
              ['(10 ; 120), les deux sommes', 'point-moyen-confondu'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-signe',
            'correlation',
            'Un coefficient de corrélation vaut −0,96. Un ajustement affine est-il justifié ?',
            'Oui : les points sont proches d’une droite qui descend',
            [
              ['Non : r est négatif', 'correlation-jugee-au-signe'],
              ['Non : la pente vaudrait −0,96', 'correlation-lue-comme-pente'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-pente',
            'correlation',
            'r = 0,98 et la droite est y = 12x + 300. Quelle hausse par rang la droite prévoit-elle ?',
            '12, le coefficient directeur',
            [
              [
                '0,98, le coefficient de corrélation',
                'correlation-lue-comme-pente',
              ],
              ['300, l’ordonnée à l’origine', 'pente-ordonnee-inversees'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-causalite',
            'correlation',
            'Les ventes de parapluies et le nombre de rhumes montent ensemble en hiver, avec r = 0,95. Que conclure ?',
            'Rien sur une cause : l’hiver fait varier les deux séries',
            [
              [
                'Les parapluies donnent des rhumes',
                'correlation-prise-pour-causalite',
              ],
              [
                'Les rhumes font acheter des parapluies',
                'correlation-prise-pour-causalite',
              ],
            ],
          ),
          moteur.rappel(
            'b2-02-r-rang',
            'prevision',
            'Droite y = 5x + 40, avec x = 1 pour 2021. Quel x utiliser pour prévoir 2026 ?',
            '6, le rang de 2026',
            [
              ['2026, l’année elle-même', 'rang-pris-pour-annee'],
              ['5, l’écart entre les deux années', 'rang-pris-pour-annee'],
            ],
          ),
          moteur.rappel(
            'b2-02-r-seuil',
            'prevision',
            'L’inéquation d’un seuil donne x ≥ 7,2. Quel est le premier rang où le seuil est atteint ?',
            '8, l’entier suivant',
            [
              ['7, l’arrondi à l’entier inférieur', 'seuil-mal-arrondi'],
              ['7,2, sans arrondir', 'seuil-mal-arrondi'],
            ],
          ),
        ],
        obligatoires: ['b2-02-r-causalite', 'b2-02-r-rang'],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-02-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : résumer, relier, prévoir',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: [...CONCEPTS_DU_COURS],
      notes: moteur.puces(
        '90 s de lecture ; la fiche s’imprime pour le classeur de CCF.',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : résumer, relier, prévoir',
      subtitle:
        'À garder pour le CCF : chaque carte part d’une question et donne la méthode et son piège.',
      imprimable: true,
      items: [
        {
          title: 'Moyenne',
          description: 'Raisonne-t-on sur un total ?',
          back: 'Somme des valeurs ÷ effectif. Une valeur extrême la tire.',
        },
        {
          title: 'Médiane',
          description: 'Cherche-t-on une moitié ?',
          back: 'Trier d’abord. Effectif pair : demi-somme des deux valeurs du milieu.',
        },
        {
          title: 'Écart-type',
          description: 'Les valeurs sont-elles régulières ?',
          back: 'Population entière : ECARTYPEP (÷ n). La variance est en unité², l’écart-type dans l’unité.',
        },
        {
          title: 'Valeur extrême',
          description: 'Une valeur tire la série ?',
          back: 'Ne pas la retirer sans pièce ; la signaler, publier la médiane à côté de la moyenne.',
        },
        {
          title: 'Point moyen',
          description: 'Où passe la droite ?',
          back: 'G(x̄ ; ȳ), les deux moyennes, jamais le point du milieu du tableau.',
        },
        {
          title: 'Corrélation r',
          description: 'Les points sont-ils alignés ?',
          back: '|r| proche de 1 : ajustement affine justifié. r n’est pas la pente et ne prouve aucune cause.',
        },
        {
          title: 'Droite des moindres carrés',
          description: 'Quelle équation ?',
          back: 'a = PENTE(y;x), b = ORDONNEE.ORIGINE(y;x) ; contrôle par G.',
        },
        {
          title: 'Prévoir',
          description: 'Quelle valeur de x ?',
          back: 'Le rang de l’année, jamais l’année. Loin des données : réserve « si la tendance se poursuit ».',
        },
        {
          title: 'Seuil',
          description: 'En quelle année ?',
          back: 'Résoudre ax + b ≥ seuil, prendre l’entier supérieur, le traduire en année.',
        },
        moteur.REFERENTIEL_DU_BTS_CG,
      ],
    },
  ),
  {
    screenId: 'B2-02-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la phrase pour la banque',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 4,
    concepts: ['choix-du-resume', 'prevision'],
    notes: moteur.puces(
      '4 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : la prévision sans réserve, la moyenne tirée par F105, la causalité.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-02-a4-billet',
          'prevision',
          true,
          'La banque lira une seule phrase. Laquelle peut partir telle quelle ?',
          'La moitié de nos factures est encaissée en 43 jours au plus ; si la tendance de 2020 à 2025 se poursuit, notre chiffre d’affaires 2028 serait d’environ 959 k€.',
          [
            [
              'La moitié de nos factures est encaissée en 43 jours au plus ; notre chiffre d’affaires 2028 sera de 959 k€.',
              'extrapolation-sans-reserve',
            ],
            [
              'Nos clients paient en moyenne à 48 jours ; si la tendance se poursuit, notre chiffre d’affaires 2028 serait d’environ 959 k€.',
              'valeur-extreme-ignoree',
            ],
            [
              'Nos délais sont réguliers, et r proche de 1 prouve que notre croissance va continuer.',
              'correlation-prise-pour-causalite',
            ],
          ],
          ['43 jours', 'environ 959 k€'],
        ),
      ],
      invite:
        'Quelle réserve la phrase juste contient-elle, et pourquoi est-elle nécessaire ?',
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'moyenne-lue-comme-mediane': 'B2-02-A1-07-EXEMPLE-RESUME',
  'mediane-sans-tri': 'B2-02-A1-07-EXEMPLE-RESUME',
  'mediane-rang-pair': 'B2-02-A1-07-EXEMPLE-RESUME',
  'valeur-extreme-ignoree': 'B2-02-A1-06-COURS-RESUMER',
  'valeur-extreme-supprimee': 'B2-02-A1-06-COURS-RESUMER',
  'ecart-type-population-echantillon': 'B2-02-A1-06-COURS-RESUMER',
  'variance-confondue-avec-ecart-type': 'B2-02-A1-06-COURS-RESUMER',
  'etendue-prise-pour-dispersion': 'B2-02-A1-06-COURS-RESUMER',
  'correlation-prise-pour-causalite': 'B2-02-A2-03-COURS-NUAGE',
  'point-moyen-confondu': 'B2-02-A2-04-EXEMPLE-NUAGE',
  'correlation-lue-comme-pente': 'B2-02-A2-03-COURS-NUAGE',
  'correlation-jugee-au-signe': 'B2-02-A2-03-COURS-NUAGE',
  'pente-ordonnee-inversees': 'B2-02-A3-03-EXEMPLE-DROITE',
  'rang-pris-pour-annee': 'B2-02-A3-03-EXEMPLE-DROITE',
  'seuil-mal-arrondi': 'B2-02-A3-03-EXEMPLE-DROITE',
  'extrapolation-sans-reserve': 'B2-02-A3-02-COURS-DROITE',
};

export const COURS_B2_02 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [],
  {
    slug: 'b2-02-series-statistiques',
    titre: 'Séries statistiques : résumer, relier, prévoir',
    gabarit: 'v3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_COURS],
  },
);
