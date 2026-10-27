import {
  DIFFUSIONS,
  ETATS_PULSE,
  MODALITES,
  PACING_MODES,
  PHASES_DE_VOTE,
  REGIMES_DE_VERROU,
  TYPES_QUESTION,
  type DecomptesParCle,
  type Diffusion,
  type EtatPulse,
  type MetadonneesBrique,
  type Modalite,
  type PacingMode,
  type RegimeVerrou,
  type ResultatQuestion,
  type ResultatsEnDirect,
  type ResultatsSeance,
  type ResumeBareme,
  type TypeQuestion,
  type ValeurProduction,
  type VotePhase,
} from './contrat-de-l-api';

type Egaux<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type Porte<T, Cle extends string> = Cle extends keyof T ? true : false;

const LISTES_FERMEES: readonly (readonly [
  string,
  readonly string[],
  readonly string[],
])[] = [
  [
    'TYPES_QUESTION',
    TYPES_QUESTION,
    ['numeric', 'vote', 'feuille', 'tableau', 'classement', 'enigme'],
  ],
  ['DIFFUSIONS', DIFFUSIONS, ['catalogue', 'seance']],
  ['ETATS_PULSE', ETATS_PULSE, ['perdu', 'ca-va', 'clair']],
  ['PHASES_DE_VOTE', PHASES_DE_VOTE, ['question-1', 'question-2']],
  ['PACING_MODES', PACING_MODES, ['pilote', 'libre']],
  ['MODALITES', MODALITES, ['solo', 'binome', 'groupe', 'classe']],
  ['REGIMES_DE_VERROU', REGIMES_DE_VERROU, ['ouvert', 'focus', 'examen']],
];

describe('contrats — listes fermées servies par l API', () => {
  it.each(LISTES_FERMEES)(
    '%s porte exactement ses valeurs, dans leur ordre',
    (_nom, liste, attendu) => {
      expect(liste).toEqual(attendu);
    },
  );

  it.each(LISTES_FERMEES)(
    '%s est gelée : aucun dépôt ne l étend à l exécution',
    (_nom, liste) => {
      expect(Object.isFrozen(liste)).toBe(true);
    },
  );

  it('chaque type fermé est l union exacte de sa liste', () => {
    const unionsExactes: [
      Egaux<
        TypeQuestion,
        'numeric' | 'vote' | 'feuille' | 'tableau' | 'classement' | 'enigme'
      >,
      Egaux<Diffusion, 'catalogue' | 'seance'>,
      Egaux<EtatPulse, 'perdu' | 'ca-va' | 'clair'>,
      Egaux<VotePhase, 'question-1' | 'question-2'>,
      Egaux<PacingMode, 'pilote' | 'libre'>,
      Egaux<Modalite, 'solo' | 'binome' | 'groupe' | 'classe'>,
      Egaux<RegimeVerrou, 'ouvert' | 'focus' | 'examen'>,
    ] = [true, true, true, true, true, true, true];

    expect(unionsExactes).not.toContain(false);
  });
});

describe('contrats — résultats d une séance', () => {
  it('les résultats en direct prolongent ceux d une séance', () => {
    const prolongement: [
      ResultatsEnDirect extends ResultatsSeance ? true : false,
      Porte<ResultatsSeance, 'statistiques'>,
    ] = [true, false];

    expect(prolongement).toEqual([true, false]);
  });

  it('une question décompte ses clés justes, ou rien hors des productions', () => {
    const decomptes: [
      Egaux<ResultatQuestion['parCle'], DecomptesParCle | null>,
      Egaux<ResultatQuestion['type'], TypeQuestion>,
    ] = [true, true];

    expect(decomptes).not.toContain(false);
  });

  it('le barème se lit par type de question', () => {
    const parType: [Egaux<keyof ResumeBareme['parType'], TypeQuestion>] = [
      true,
    ];

    expect(parType).not.toContain(false);
  });

  it('une production « je ne sais pas » ne porte aucune saisie', () => {
    type SansReponse = Extract<ValeurProduction, { readonly neSaitPas: true }>;
    const sansSaisie: [
      Porte<SansReponse, 'cellules'>,
      Egaux<SansReponse['type'], 'feuille' | 'tableau' | 'classement'>,
    ] = [false, true];

    expect(sansSaisie).toEqual([false, true]);
  });

  it('les métadonnées d une brique reprennent les listes fermées', () => {
    const metadonnees: [
      Egaux<MetadonneesBrique['modalite'], Modalite>,
      Egaux<MetadonneesBrique['regime'], RegimeVerrou>,
    ] = [true, true];

    expect(metadonnees).not.toContain(false);
  });
});
