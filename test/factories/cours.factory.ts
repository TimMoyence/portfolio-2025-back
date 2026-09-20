import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import {
  questionNumerique,
  questionVote,
} from '../../src/modules/formations/domain/cours/Cours';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';
import { ouvrirTirages } from '../../src/modules/formations/domain/cours/OuvertureTirages';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import type { AnswerRecord } from '../../src/modules/formations/domain/IAnswers.repository';
import type { ParticipantRecord } from '../../src/modules/formations/domain/IParticipants.repository';
import type { SessionRecord } from '../../src/modules/formations/domain/ISessions.repository';
import {
  buildCorrigeClassement,
  buildCorrigeEnigme,
  buildCorrigeFeuille,
  buildCorrigeTableau,
  buildPlanFeuille,
} from './corriges.factory';
import {
  buildAnswerRecord,
  buildParticipantRecord,
  buildSessionRecord,
} from './formation.factory';

export const EN_CATALOGUE = { titre: null, diffusion: 'catalogue' } as const;

export const QUESTION_NUMERIQUE_TEST = questionNumerique({
  id: 'Q-TEST-NUM',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (tirage) => ({
    depart: tirage.entier(100, 900),
    hausse: tirage.entier(5, 40),
  }),
  enonce: ({ depart, hausse }) =>
    `Un prix de ${depart} € augmente de ${hausse} %. Nouveau prix ?`,
  unite: '€',
  solution: ({ depart, hausse }) => depart * (1 + hausse / 100),
  tolerance: { type: 'absolue', valeur: 0.01 },
  pieges: [
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      valeur: ({ depart, hausse }) => (depart * hausse) / 100,
    },
  ],
});

function numeriqueTest(id: string) {
  return questionNumerique({
    id,
    concept: 'coefficient-multiplicateur',
    noteCompte: true,
    donnees: (tirage) => ({ base: tirage.entier(1000, 999999) }),
    enonce: ({ base }) =>
      `Valeur de référence ${base} : que vaut-elle majorée de 0,42 ?`,
    unite: null,
    solution: ({ base }) => base + 0.42,
    tolerance: { type: 'relative', valeur: 0.005 },
    pieges: [
      {
        confusion: 'raisonnement-additif',
        valeur: ({ base }) => base * 3 + 0.77,
      },
    ],
  });
}

function voteTest(id: string) {
  return questionVote({
    id,
    concept: 'evolutions-successives',
    noteCompte: false,
    donnees: () => ({}),
    enonce: () => 'Un prix augmente de 20 % puis baisse de 20 %. Il est :',
    bonne: () => 'plus bas qu’au départ',
    pieges: [
      {
        confusion: 'hausse-baisse-symetriques',
        libelle: () => 'revenu au prix de départ',
      },
      {
        confusion: 'raisonnement-additif',
        libelle: () => 'plus haut qu’au départ',
      },
    ],
  });
}

export const QUESTION_RAPPEL_TEST = voteTest('Q-TEST-RAPPEL');
export const QUESTION_VOTE_TEST = voteTest('Q-TEST-VOTE');
export const QUESTION_EXIT_TEST = voteTest('Q-TEST-EXIT');
export const QUESTION_PAIRS_TEST = voteTest('Q-TEST-PAIRS');
export const QUESTION_JUMELLE_TEST = voteTest('Q-TEST-JUMELLE');

export function buildEcranDeVoteJumele(): Ecran {
  return {
    ...EN_CATALOGUE,
    id: 'E-VOTE',
    brique: 'fp-vote',
    dureeMinutes: 6,
    concepts: ['evolutions-successives'],
    notes: 'Vote, débat, cas jumeau',
    question: QUESTION_PAIRS_TEST,
    questionJumelle: QUESTION_JUMELLE_TEST,
  };
}

export function buildCoursAvecVoteJumele(
  overrides: Partial<Cours> = {},
): Cours {
  const socle = buildCoursDeTest(overrides);
  return {
    ...socle,
    ecrans: [...socle.ecrans, buildEcranDeVoteJumele()],
  };
}

function planDeFeuilleTest() {
  const socle = buildPlanFeuille({ id: 'Q-TEST-FEUILLE' });
  return {
    ...socle,
    cellules: { ...socle.cellules, B3: '210000', C3: '230000' },
    verrouillees: [...socle.verrouillees, 'B3', 'C3'],
  };
}

export const PLAN_DE_CLASSEMENT_TEST = {
  id: 'Q-TEST-CLASSEMENT',
  intitule: 'Trier les indicateurs',
  cartes: [
    { id: 'ca-2025', libelle: 'CA 2025 : 397 000 €' },
    { id: 'inflation', libelle: 'Inflation' },
  ],
  categories: [
    { id: 'valeur', libelle: 'Valeur' },
    { id: 'ambigu', libelle: 'Ambigu' },
    { id: 'taux', libelle: 'Taux' },
  ],
} as const;

const PLAN_DE_TABLEAU_TEST = {
  id: 'Q-TEST-TABLEAU',
  intitule: 'Chaîne d’évolutions',
  consignes: ['Saisissez le prix facturé de chaque révision.'],
  echeances: 2,
  libellesLignes: ['Révision 1', 'Révision 2'],
  parametres: { prixInitial: 20 },
  colonnes: [
    {
      cle: 'taux',
      intitule: 'Taux',
      role: 'donnee' as const,
      decimales: 2,
      valeurs: [8, -5],
      totalise: false,
    },
    {
      cle: 'prix',
      intitule: 'Prix facturé',
      role: 'saisie' as const,
      decimales: 2,
      totalise: false,
    },
  ],
  synthese: [],
};

export const PARCOURS_DE_TEST = 'P-TEST-COFFRE';
export const ENIGMES_DE_TEST = ['E1-MIX', 'E2-IND', 'E3-TVA'] as const;
export const TENTATIVES_MAX_DE_TEST = 10;

function enigmeDeTest(rang: number) {
  const id = ENIGMES_DE_TEST[rang];
  return {
    id,
    type: 'enigme' as const,
    concept: 'evolutions-successives' as const,
    noteCompte: false,
    confusions: ['moyenne-simple-des-taux'] as ['moyenne-simple-des-taux'],
    corrige: buildCorrigeEnigme({
      parcoursId: PARCOURS_DE_TEST,
      enigmeId: id,
      rang,
      solution: {
        type: 'nombre',
        valeur: 23.4 + rang,
        tolerance: { type: 'absolue', valeur: 0.05 },
        formePubliee: String(23.4 + rang),
      },
      fragment: `F${rang}`,
    }),
  };
}

export function buildEcranDEnigmes(): Ecran {
  return {
    ...EN_CATALOGUE,
    id: 'E-COFFRE',
    brique: 'fp-escape',
    dureeMinutes: 12,
    concepts: ['evolutions-successives'],
    notes: 'Mini-jeu du coffre',
    proprietes: {
      parcours: {
        id: PARCOURS_DE_TEST,
        intitule: 'Le coffre du comité',
        delaiIndiceMs: 60000,
        budgetEnigmeMs: 180000,
        tentativesMax: TENTATIVES_MAX_DE_TEST,
        enigmes: ENIGMES_DE_TEST.map((id, rang) => ({
          id,
          intitule: `Énigme ${rang + 1}`,
          enonce: `Énoncé de l’énigme ${rang + 1}.`,
          indice: 'Relisez la base de calcul.',
        })) as [
          { id: string; intitule: string; enonce: string; indice: string },
          ...{ id: string; intitule: string; enonce: string; indice: string }[],
        ],
      },
    },
    enigmes: [enigmeDeTest(0), enigmeDeTest(1), enigmeDeTest(2)],
  };
}

export const SONDAGE_DE_TEST = 'jalon-test-1';

export function buildEcranDeJalon(): Ecran {
  return {
    ...EN_CATALOGUE,
    id: 'E-JALON',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['evolutions-successives'],
    notes: 'Jalon de confiance',
    proprietes: {
      sondage: { id: SONDAGE_DE_TEST, invite: 'Où en êtes-vous ?' },
    },
  };
}

export function buildCoursAvecJalon(overrides: Partial<Cours> = {}): Cours {
  const socle = buildCoursDeTest(overrides);
  return { ...socle, ecrans: [...socle.ecrans, buildEcranDeJalon()] };
}

export function buildCoursAvecEnigmes(overrides: Partial<Cours> = {}): Cours {
  const socle = buildCoursDeTest(overrides);
  return { ...socle, ecrans: [...socle.ecrans, buildEcranDEnigmes()] };
}

export function buildCoursAvecProductions(
  overrides: Partial<Cours> = {},
): Cours {
  const socle = buildCoursDeTest(overrides);
  return {
    ...socle,
    ecrans: [
      ...socle.ecrans,
      {
        ...EN_CATALOGUE,
        id: 'E-FEUILLE',
        brique: 'fp-sheet',
        dureeMinutes: 12,
        concepts: ['tableur'],
        notes: 'Tâche de tableur',
        proprietes: { plan: planDeFeuilleTest() },
        production: {
          id: 'Q-TEST-FEUILLE',
          type: 'feuille',
          concept: 'tableur',
          noteCompte: true,
          confusions: ['taux-valeur-facteur-cent'],
          corrige: buildCorrigeFeuille({ plan: planDeFeuilleTest() }),
        },
      },
      {
        ...EN_CATALOGUE,
        id: 'E-CARTES',
        brique: 'fp-cardsort',
        dureeMinutes: 10,
        concepts: ['lecture-graphique'],
        notes: 'Tri de cartes',
        proprietes: { plan: PLAN_DE_CLASSEMENT_TEST },
        production: {
          id: 'Q-TEST-CLASSEMENT',
          type: 'classement',
          concept: 'lecture-graphique',
          noteCompte: true,
          confusions: ['valeur-confondue-avec-taux'],
          corrige: buildCorrigeClassement(),
        },
      },
      {
        ...EN_CATALOGUE,
        id: 'E-TABLEAU',
        brique: 'fp-table-build',
        dureeMinutes: 12,
        concepts: ['evolutions-successives'],
        notes: 'Construction de tableau',
        proprietes: { plan: PLAN_DE_TABLEAU_TEST },
        production: {
          id: 'Q-TEST-TABLEAU',
          type: 'tableau',
          concept: 'evolutions-successives',
          noteCompte: true,
          confusions: ['taux-successifs-additionnes'],
          corrige: buildCorrigeTableau(),
        },
      },
    ],
  };
}

export function buildCoursDeTest(overrides: Partial<Cours> = {}): Cours {
  return {
    slug: 'cours-de-test',
    titre: 'Cours de test',
    niveau: 'B2',
    dureeMinutes: 38,
    concepts: ['taux-evolution'],
    ecrans: [
      {
        ...EN_CATALOGUE,
        id: 'E-OUV',
        brique: 'fp-recall',
        dureeMinutes: 5,
        concepts: ['evolutions-successives'],
        notes: 'Rappel',
        question: QUESTION_RAPPEL_TEST,
        delaiMs: 0,
        seuil: 0.6,
      },
      {
        ...EN_CATALOGUE,
        id: 'E-CITATION',
        brique: 'fp-quote',
        dureeMinutes: 3,
        concepts: ['proportion'],
        notes: 'Accroche',
        proprietes: {
          texte: 'Les chiffres parlent.',
          auteur: null,
          source: null,
        },
      },
      {
        ...EN_CATALOGUE,
        id: 'E-NUM',
        brique: 'fp-numeric',
        dureeMinutes: 5,
        concepts: ['taux-evolution'],
        notes: 'Pivot',
        question: QUESTION_NUMERIQUE_TEST,
      },
      {
        ...EN_CATALOGUE,
        id: 'E-CONCEPT',
        brique: 'fp-concept4',
        dureeMinutes: 5,
        concepts: ['coefficient-multiplicateur'],
        notes: 'Curseurs',
        proprietes: {
          parametres: [
            {
              cle: 'prix',
              libelle: 'Prix',
              min: 10,
              max: 1000,
              pas: 10,
              defaut: 100,
            },
            {
              cle: 'taux',
              libelle: 'Taux',
              min: -50,
              max: 50,
              pas: 1,
              defaut: 10,
            },
          ],
          formuleLatexSimplifie: 'prix \\times (1 + taux/100)',
          calcul: 'prix*(1+taux/100)',
          phrase:
            'Un prix de {prix} € modifié de {taux} % devient {resultat} €.',
        },
      },
      {
        ...EN_CATALOGUE,
        id: 'E-PRATIQUE',
        brique: 'questionnaire',
        dureeMinutes: 10,
        concepts: ['coefficient-multiplicateur'],
        notes: 'Pratique',
        intitule: 'Pratique',
        consigne: 'Répondez aux trois questions.',
        regime: 'focus',
        ordre: 'melange',
        questions: [
          numeriqueTest('Q-TEST-NUM-2'),
          numeriqueTest('Q-TEST-NUM-3'),
          QUESTION_VOTE_TEST,
        ],
      },
      {
        ...EN_CATALOGUE,
        id: 'E-REM',
        brique: 'fp-worked',
        dureeMinutes: 5,
        concepts: ['taux-evolution'],
        notes: 'Remédiation',
        proprietes: {
          exemple: {
            id: 'E-REM',
            enonce: 'Reprenons un taux pas à pas.',
            etapes: [
              {
                id: 'etape-1',
                intitule: 'Écart',
                raisonnement: 'Arrivée moins départ.',
                invite: 'Pourquoi le départ ?',
              },
            ],
          },
          etayage: 1,
        },
      },
      {
        ...EN_CATALOGUE,
        id: 'E-EXIT',
        brique: 'fp-exit',
        dureeMinutes: 5,
        concepts: ['evolutions-successives'],
        notes: 'Clôture',
        question: QUESTION_EXIT_TEST,
        invite: 'Qu’est-ce qui reste flou ?',
      },
    ],
    remediations: {
      'hausse-baisse-symetriques': 'E-REM',
      'raisonnement-additif': 'E-REM',
      'ecart-absolu-au-lieu-du-taux': 'E-REM',
    },
    medias: [],
    ...overrides,
  };
}

export function buildCoursDeClasse(nombreQuestions: number): Cours {
  const ecrans: Ecran[] = Array.from(
    { length: nombreQuestions },
    (_, rang) => ({
      ...EN_CATALOGUE,
      id: `E-Q-${String(rang).padStart(2, '0')}`,
      brique: 'fp-numeric' as const,
      dureeMinutes: 5,
      concepts: ['coefficient-multiplicateur'] as const,
      notes: '',
      question: numeriqueTest(`Q-PARCOURS-${String(rang).padStart(2, '0')}`),
    }),
  );
  const [premier, ...suite] = ecrans;
  return buildCoursDeTest({
    slug: 'cours-de-classe',
    dureeMinutes: 5 * nombreQuestions + 5,
    ecrans: [
      premier,
      ...suite,
      {
        ...EN_CATALOGUE,
        id: 'E-FIN',
        brique: 'fp-exit',
        dureeMinutes: 5,
        concepts: ['evolutions-successives'],
        notes: '',
        question: QUESTION_EXIT_TEST,
        invite: 'Bilan',
      },
    ],
  });
}

export function buildCoursSansTirageValide(): Cours {
  const toujoursAmbigue = questionNumerique({
    id: 'Q-TOUJOURS-AMBIGUE',
    concept: 'proportion',
    noteCompte: false,
    donnees: () => ({}),
    enonce: () => 'Question dont le piege vaut la solution',
    unite: null,
    solution: () => 1,
    tolerance: { type: 'absolue', valeur: 0 },
    pieges: [{ confusion: 'base-arrivee', valeur: () => 1 }],
  });
  return buildCoursDeTest({
    slug: 'cours-sans-tirage',
    ecrans: [
      {
        ...EN_CATALOGUE,
        id: 'E-AMBIGU',
        brique: 'fp-numeric',
        dureeMinutes: 1,
        concepts: ['proportion'],
        notes: '',
        question: toujoursAmbigue,
      },
    ],
  });
}

export function buildCoursAuTirageEnErreur(): Cours {
  const bornesInversees = questionNumerique({
    id: QUESTION_NUMERIQUE_TEST.id,
    concept: 'taux-evolution',
    noteCompte: true,
    donnees: (tirage) => ({ depart: tirage.entier(900, 100) }),
    enonce: ({ depart }) => `Que vaut ${depart} ?`,
    unite: null,
    solution: ({ depart }) => depart,
    tolerance: { type: 'absolue', valeur: 0.01 },
    pieges: [
      {
        confusion: 'ecart-absolu-au-lieu-du-taux',
        valeur: ({ depart }) => depart / 100,
      },
    ],
  });
  const [premier, ...suite] = buildCoursDeTest().ecrans.map(
    (ecran): Ecran =>
      ecran.brique === 'fp-numeric'
        ? { ...ecran, question: bornesInversees }
        : ecran,
  );
  return buildCoursDeTest({ ecrans: [premier, ...suite] });
}

export function tireurSequentiel(depart = 0): (borne: number) => number {
  let courant = depart;
  return () => courant++;
}

export interface SeanceRepondue {
  readonly session: SessionRecord;
  readonly participant: ParticipantRecord;
  readonly reponse: AnswerRecord;
  readonly libelleAttendu: string;
}

export function buildSeanceRepondueAuRappel(
  session: Partial<SessionRecord> = {},
  cours: Cours = buildCoursDeTest(),
): SeanceRepondue {
  const bareme = ouvrirTirages(cours, tireurSequentiel());
  const graine = bareme.tirages[0].seed;
  const tirage = tirer(cours, graine);
  const bonne = String(tirage.solutions[QUESTION_RAPPEL_TEST.id].valeur);
  const participant = buildParticipantRecord({ id: 'p1', seed: graine });
  return {
    session: buildSessionRecord({ courseSlug: cours.slug, bareme, ...session }),
    participant,
    reponse: buildAnswerRecord({
      participantId: participant.id,
      questionId: QUESTION_RAPPEL_TEST.id,
      valeur: bonne,
      seed: graine,
    }),
    libelleAttendu: tirage.libellesOptions[QUESTION_RAPPEL_TEST.id][bonne],
  };
}

type VersionsDuCours = Readonly<Record<number, Cours>>;

export function creerCatalogueAVersions(
  versionsParSlug: Readonly<Record<string, VersionsDuCours>>,
): ICatalogueCours {
  const versionsDe = (slug: string): VersionsDuCours =>
    Object.hasOwn(versionsParSlug, slug) ? versionsParSlug[slug] : {};
  const courant = (slug: string): { cours: Cours; version: number } | null => {
    const versions = versionsDe(slug);
    const derniere = Math.max(...Object.keys(versions).map(Number));
    return Number.isFinite(derniere)
      ? { cours: versions[derniere], version: derniere }
      : null;
  };
  return {
    trouver: (slug, version) =>
      Promise.resolve(
        version === undefined
          ? (courant(slug)?.cours ?? null)
          : (versionsDe(slug)[version] ?? null),
      ),
    trouverCourant: (slug) => Promise.resolve(courant(slug)),
  };
}

export function creerCatalogueDeTest(...cours: Cours[]): ICatalogueCours {
  const versionsParSlug: Record<string, VersionsDuCours> = {};
  for (const unCours of cours.length > 0 ? cours : [buildCoursDeTest()]) {
    if (Object.hasOwn(versionsParSlug, unCours.slug)) {
      throw new Error(
        `Slug de cours en double dans le catalogue de test : « ${unCours.slug} ».`,
      );
    }
    versionsParSlug[unCours.slug] = { 1: unCours };
  }
  return creerCatalogueAVersions(versionsParSlug);
}
