import type {
  ContenuAPublier,
  ContenuDeCoursBrut,
  EcranDeCoursBrut,
} from '../../src/modules/formations/domain/cours/CoursStocke';
import {
  buildCorrigeClassement,
  buildCorrigeDefi,
  buildCorrigeEnigme,
  buildCorrigeFeuille,
  buildCorrigeRevelation,
  buildCorrigeTableau,
  buildPlanFeuille,
} from './corriges.factory';
import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildVoteStocke,
} from './questions-stockees.factory';

export const NOTES_DU_FORMATEUR = [
  '• Projeter, puis lire la réponse dominante.',
  '• Contrôle : refaire le calcul.',
].join('\n');

export const PLAN_CLASSEMENT = {
  id: 'b2-01-a1-anatomie',
  intitule: 'Classez chaque chiffre du tableau de bord selon ce qu’il exprime.',
  cartes: [
    { id: 'ca-2025', libelle: 'CA HT 2025 : 1 150 000 €' },
    { id: 'inflation', libelle: 'Inflation : « 4,9 »' },
  ],
  categories: [
    { id: 'valeur', libelle: 'Valeur en euros' },
    { id: 'ambigu', libelle: 'Ambigu en l’état' },
  ],
} as const;

export const PLAN_TABLEAU = {
  id: 'b2-01-a4-indice-toile',
  intitule: 'Tâche de tableur 2 — Prix et indice de la toile en 2025',
  consignes: ['Arrondissez chaque prix au centime.'],
  echeances: 2,
  libellesLignes: ['1er mars : +8 %', '1er juin : −5 %'],
  parametres: { prixInitial: 20 },
  colonnes: [
    {
      cle: 'taux',
      intitule: 'Taux annoncé (%)',
      role: 'donnee',
      valeurs: [8, -5],
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'prix',
      intitule: 'Prix du m² après révision (€ HT)',
      role: 'saisie',
      decimales: 2,
      totalise: false,
    },
    {
      cle: 'coef',
      intitule: 'Coefficient appliqué',
      role: 'deduite',
      formuleInitiale: 'prix / prixInitial',
      formule: 'prix / avantPrix',
      decimales: 4,
      totalise: false,
    },
  ],
  synthese: [
    {
      libelle: 'Somme des taux annoncés',
      formule: 'totalTaux',
      unite: '%',
      decimales: 2,
    },
  ],
} as const;

export const PARCOURS_ENIGMES = {
  id: 'b2-01-a6-coffre',
  intitule: 'Le coffre du comité',
  delaiIndiceMs: 60000,
  budgetEnigmeMs: 150000,
  tentativesMax: 10,
  enigmes: [
    {
      id: 'b2-01-a6-e1-mix',
      intitule: 'Le premier semestre 2026',
      enonce: 'Quel est le taux de marge brute global ?',
      indice: 'Additionnez les marges en euros, puis divisez par le CA total.',
    },
  ],
} as const;

const PROPRIETES_PAR_BRIQUE: Readonly<Record<string, Record<string, unknown>>> =
  {
    'fp-quote': {
      texte: 'Un chiffre sans unité ne dit rien.',
      auteur: null,
      source: null,
    },
    'fp-story': {
      titre: 'Capsule',
      paragraphes: ['Regardez la capsule.'],
      video: {
        src: '/assets/cours/b2-01/v3/capsule-720p.webm',
        srcPoste: '/assets/cours/b2-01/v3/capsule-480p.webm',
        type: 'video/webm',
        titre: 'Une formule qui se recopie',
        poster: '/assets/cours/b2-01/v3/capsule.jpg',
        transcript: '[Carton titre] Une formule qui se recopie.',
        source: '/formations/b2-01-traitement-information-chiffree',
        licence: 'CC BY-SA 4.0 · Asili Design, 2026',
        sousTitres: {
          src: '/assets/cours/b2-01/v3/capsule.fr.vtt',
          srclang: 'fr',
          libelle: 'Français',
        },
        preload: 'none',
      },
    },
    'fp-pro': {
      metier: 'Assistant·e de gestion',
      situation: 'Lundi, 8 h 40.',
      geste: 'Dire ce que mesure chaque chiffre.',
      consequence: null,
    },
    'fp-worked': {
      modalite: 'solo',
      exemple: {
        id: 'b2-01-a2-points',
        enonce: 'Le taux de marge brute passe de 27,60 % à 25,30 %.',
        etapes: [
          {
            id: 'ecart',
            intitule: 'Écart entre les deux taux',
            raisonnement: '25,30 − 27,60 = −2,30 points.',
            invite: 'Écrivez l’écart avec son unité.',
          },
        ],
      },
      etayage: 1,
    },
    'fp-concept4': {
      id: 'b2-01-a3-machine',
      parametres: [
        {
          cle: 'depart',
          libelle: 'Valeur de départ (€)',
          min: 1,
          max: 200,
          pas: 1,
          defaut: 100,
        },
      ],
      formuleLatexSimplifie: 'arrivée = départ × (1 + t₁)',
      calcul: 'depart * 2',
      phrase: 'On multiplie les coefficients.',
    },
    'fp-plot': {
      id: 'b2-01-a2-origine-axe',
      titre: 'Marge brute',
      source: 'Données fictives',
      abscisse: { libelle: 'Année', min: 0, max: 3 },
      ordonnee: 'Marge brute (€)',
      bornesOrdonnee: { minParametre: 'origine', maxParametre: 'maximum' },
      parametres: [
        {
          cle: 'origine',
          libelle: 'Origine',
          min: 0,
          max: 284000,
          pas: 4000,
          defaut: 284000,
        },
        {
          cle: 'maximum',
          libelle: 'Haut de l’axe',
          min: 292000,
          max: 600000,
          pas: 4000,
          defaut: 292000,
        },
      ],
      series: [
        { id: 'marge', libelle: 'Marge brute', trait: 'plein', calcul: 'x' },
      ],
      description: 'Courbe de la marge brute.',
    },
    'fp-pulse': {
      sondage: { id: 'b2-01-a1-jalon', invite: 'Je sais lire un chiffre.' },
    },
    'fp-challenge': {
      probleme: {
        id: 'b2-01-a1-audit-diapositive',
        enonce: 'La barre 2025 est sept fois plus haute.',
        invite: 'Écrivez trois vérifications.',
      },
      corrige: buildCorrigeDefi(),
    },
    'fp-cardsort': {
      modalite: 'binome',
      plan: PLAN_CLASSEMENT,
      questions: [
        {
          type: 'classement',
          id: PLAN_CLASSEMENT.id,
          concept: 'contrat-de-lecture',
          noteCompte: true,
          corrige: buildCorrigeClassement(),
        },
      ],
    },
    'fp-sheet': {
      plan: buildPlanFeuille(),
      questions: [
        {
          type: 'feuille',
          id: buildPlanFeuille().id,
          concept: 'tableur',
          noteCompte: true,
          corrige: buildCorrigeFeuille(),
        },
      ],
    },
    'fp-table-build': {
      plan: PLAN_TABLEAU,
      questions: [
        {
          type: 'tableau',
          id: PLAN_TABLEAU.id,
          concept: 'evolutions-successives',
          noteCompte: true,
          corrige: buildCorrigeTableau(),
        },
      ],
    },
    'fp-escape': {
      parcours: PARCOURS_ENIGMES,
      questions: [
        {
          type: 'enigme',
          id: 'b2-01-a6-e1-mix',
          concept: 'moyenne-ponderee',
          noteCompte: false,
          corrige: buildCorrigeEnigme(),
        },
      ],
    },
    'fp-spaced': {
      rappel: { id: 'b2-01-a6-rappel', intitule: 'Rappel de mémoire' },
      banque: {
        questions: [
          buildVoteStocke({
            id: 'b2-01-r-compensation',
            concept: 'controle-coherence',
            noteCompte: false,
            enonce: 'Peut-on valider chaque écriture ?',
            options: [
              buildOptionStockee('Non : deux erreurs se compensent', null),
              buildOptionStockee(
                'Oui : le total concorde',
                'total-concordant-vaut-preuve',
              ),
            ],
          }),
          buildVoteStocke({
            id: 'b2-01-r-points',
            concept: 'point-de-pourcentage',
            noteCompte: false,
            enonce: 'Le taux passe de 4 % à 5 %. Quelle phrase est exacte ?',
            options: [
              buildOptionStockee('+1 point', null),
              buildOptionStockee('+1 %', 'points-confondus-avec-pourcentage'),
            ],
          }),
        ],
        obligatoires: ['b2-01-r-compensation'],
      },
    },
    'fp-numeric': {
      questions: [
        buildNumeriqueStockee({ id: 'b2-01-a5-part-marge-marketplace' }),
      ],
      seuil: 0.6,
    },
    'fp-vote': {
      modalite: 'solo',
      questions: [
        buildVoteStocke({ id: 'b2-01-a3-sac-v1', segments: ['+25 %'] }),
        buildVoteStocke({
          id: 'b2-01-a3-remise-v2',
          enonce: 'De quel pourcentage le net est-il inférieur ?',
          options: [
            buildOptionStockee('11,8 %', null),
            buildOptionStockee('12 %', 'taux-successifs-additionnes'),
          ],
        }),
      ],
      corrige: buildCorrigeRevelation(),
    },
    'fp-recall': { questions: [buildVoteStocke()], delaiMs: 45000 },
    'fp-exit': {
      questions: [buildVoteStocke({ id: 'b2-01-a6-billet' })],
      invite: 'Justifiez en trois phrases.',
    },
    questionnaire: {
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: 'Calculatrice autorisée.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        buildVoteStocke({ id: 'b2-01-a2-evolution-marge' }),
        buildNumeriqueStockee(),
      ],
    },
  };

export const BRIQUES_STOCKEES = Object.keys(PROPRIETES_PAR_BRIQUE);

export function buildProprietesStockees(
  brique: string,
): Record<string, unknown> {
  if (!Object.hasOwn(PROPRIETES_PAR_BRIQUE, brique)) {
    throw new Error(`Aucune propriété de test pour la brique ${brique}`);
  }
  return structuredClone(PROPRIETES_PAR_BRIQUE[brique]);
}

export function buildCasAQuestionsLibres(): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-pro', {
    screenId: 'B2-01-A1-03-MISSION',
    proprietes: {
      ...buildProprietesStockees('fp-pro'),
      questionsLibres: [
        {
          id: 'b2-01-a1-mission:mesure',
          question: 'Que mesure chaque chiffre ?',
          placeholder: 'Un montant, une part, une évolution…',
        },
        {
          id: 'b2-01-a1-mission:comparable',
          question: 'Les bases et les périodes sont-elles comparables ?',
        },
      ],
    },
  });
}

export function buildEcranDeBrique(
  brique: string,
  overrides: Partial<EcranDeCoursBrut> = {},
): EcranDeCoursBrut {
  return {
    screenId: `B2-01-A1-01-${brique.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
    titre: `Écran ${brique}`,
    diffusion: 'seance',
    brique,
    dureeMinutes: 8,
    concepts: ['proportion'],
    notes: NOTES_DU_FORMATEUR,
    proprietes: buildProprietesStockees(brique),
    ...overrides,
  };
}

export function buildEcranDeTableau(
  screenId: string,
  lignes: readonly Record<string, string>[],
): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-story', {
    screenId,
    diffusion: 'catalogue',
    dureeMinutes: 1,
    proprietes: {
      presentation: {
        version: 2,
        screenId,
        renderer: 'table',
        props: {
          title: 'Tableau de bord',
          columns: [
            { key: 'indicateur', label: 'Indicateur' },
            { key: 'valeur', label: 'Valeur' },
          ],
          rows: lignes,
        },
      },
    },
  });
}

export function buildCorrectionDeReponses(
  source: string,
  screenId = `${source}-CORRECTION`,
  overrides: Partial<EcranDeCoursBrut> = {},
): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-story', {
    screenId,
    dureeMinutes: 1,
    proprietes: {
      presentation: {
        version: 2,
        screenId,
        renderer: 'answer-review',
        props: {
          title: 'Correction',
          source: { screenId: source },
          explications: [
            { reference: 'b2-01-a1-diagnostic', texte: 'Réponse expliquée.' },
          ],
        },
      },
    },
    ...overrides,
  });
}

export function buildCorrectionDExemple(
  source: string,
  screenId = `${source}-CORRECTION`,
  overrides: Partial<EcranDeCoursBrut> = {},
): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-worked', {
    screenId,
    dureeMinutes: 2,
    proprietes: {
      ...buildProprietesStockees('fp-worked'),
      exemple: {
        ...(buildProprietesStockees('fp-worked').exemple as Record<
          string,
          unknown
        >),
        id: `${screenId.toLowerCase()}-corrige`,
      },
      pilote: true,
      etayage: 0,
      corrigeDe: source,
    },
    ...overrides,
  });
}

export function buildCoursDeBriques(
  ecrans: readonly EcranDeCoursBrut[],
  overrides: Partial<ContenuDeCoursBrut> = {},
): ContenuDeCoursBrut {
  return { version: 3, ...buildContenuPubliable(ecrans), ...overrides };
}

export function buildContenuPubliable(
  ecrans: readonly EcranDeCoursBrut[],
  overrides: Partial<ContenuAPublier> = {},
): ContenuAPublier {
  return {
    slug: 'b2-01-traitement-information-chiffree',
    titre: 'Traitement de l’information chiffrée',
    niveau: 'B2',
    dureeMinutes: ecrans.reduce(
      (total, ecran) => total + ecran.dureeMinutes,
      0,
    ),
    concepts: ['proportion'],
    remediations: {},
    medias: [],
    ecrans,
    ...overrides,
  };
}
