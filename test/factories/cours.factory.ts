import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/cours/Cours';
import {
  questionNumerique,
  questionVote,
} from '../../src/modules/formations/domain/cours/Cours';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';

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

export function buildCoursDeTest(overrides: Partial<Cours> = {}): Cours {
  return {
    slug: 'cours-de-test',
    titre: 'Cours de test',
    niveau: 'B2',
    dureeMinutes: 38,
    concepts: ['taux-evolution'],
    ecrans: [
      {
        id: 'E-OUV',
        brique: 'fp-recall',
        dureeMinutes: 5,
        concepts: ['evolutions-successives'],
        notes: 'Rappel',
        question: QUESTION_RAPPEL_TEST,
        seuil: 0.6,
      },
      {
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
        id: 'E-NUM',
        brique: 'fp-numeric',
        dureeMinutes: 5,
        concepts: ['taux-evolution'],
        notes: 'Pivot',
        question: QUESTION_NUMERIQUE_TEST,
      },
      {
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
        id: 'E-PRATIQUE',
        brique: 'questionnaire',
        dureeMinutes: 10,
        concepts: ['coefficient-multiplicateur'],
        notes: 'Pratique',
        regime: 'focus',
        questions: [
          numeriqueTest('Q-TEST-NUM-2'),
          numeriqueTest('Q-TEST-NUM-3'),
          QUESTION_VOTE_TEST,
        ],
      },
      {
        id: 'E-REM',
        brique: 'fp-worked',
        dureeMinutes: 5,
        concepts: ['taux-evolution'],
        notes: 'Remédiation',
        proprietes: {
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
      },
      {
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
    ...overrides,
  };
}

export function buildCoursDeClasse(nombreQuestions: number): Cours {
  const ecrans: Ecran[] = Array.from(
    { length: nombreQuestions },
    (_, rang) => ({
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

export function creerCatalogueDeTest(...cours: Cours[]): ICatalogueCours {
  const parSlug = new Map<string, Cours>();
  for (const unCours of cours.length > 0 ? cours : [buildCoursDeTest()]) {
    if (parSlug.has(unCours.slug)) {
      throw new Error(
        `Slug de cours en double dans le catalogue de test : « ${unCours.slug} ».`,
      );
    }
    parSlug.set(unCours.slug, unCours);
  }
  return {
    trouver: (slug, version) =>
      Promise.resolve(
        version === undefined || version === 1
          ? (parSlug.get(slug) ?? null)
          : null,
      ),
    trouverCourant: (slug) => {
      const unCours = parSlug.get(slug);
      return Promise.resolve(
        unCours === undefined ? null : { cours: unCours, version: 1 },
      );
    },
  };
}
