import type { z } from 'zod';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import {
  slugOption,
  type numeriqueStockee,
  type voteStocke,
} from '../../domain/cours/QuestionStockee';

type EcranDuCours = ContenuDeCours['ecrans'][number];
export type Acte = [EcranDuCours, ...EcranDuCours[]];
export type EcranDeRecit = Extract<
  EcranDuCours,
  { readonly brique: 'fp-story' }
>;
export type SocleDEcran = Omit<EcranDeRecit, 'brique' | 'proprietes'>;
type ReserveDuRecit = Omit<EcranDeRecit['proprietes'], 'presentation'>;
type EcranDeTri = Extract<EcranDuCours, { readonly brique: 'fp-cardsort' }>;
type ProprietesDeClassement = EcranDeTri['proprietes'];
type CorrectionDeTri = Omit<SocleDEcran, 'diffusion'> & {
  readonly sousTitre: string;
  readonly intitule?: string;
};
type CorrectionDeReponses = Omit<SocleDEcran, 'diffusion' | 'titre'> & {
  readonly titre: string;
  readonly sousTitre?: string;
};
type EcranDExemple = Extract<EcranDuCours, { readonly brique: 'fp-worked' }>;
type VoteDuCours = z.input<typeof voteStocke>;
type NumeriqueDuCours = z.input<typeof numeriqueStockee>;
export type AuMoinsUn<T> = [T, ...T[]];
export type Piege = readonly [string, ConfusionId];
export type PlanDeTableau = Extract<
  EcranDuCours,
  { readonly brique: 'fp-table-build' }
>['proprietes']['plan'];

export const TOLERANCE_RELATIVE = {
  type: 'relative',
  valeur: 0.0001,
} as const;
export const TOLERANCE_NULLE = { type: 'absolue', valeur: 0 } as const;
export const DEUX_DECIMALES = { type: 'decimales', valeur: 2 } as const;

function mapper<T, U>(
  liste: AuMoinsUn<T>,
  transformer: (element: T) => U,
): AuMoinsUn<U> {
  const [premier, ...suite] = liste;
  return [transformer(premier), ...suite.map(transformer)];
}

export function puces(...lignes: AuMoinsUn<string>): string {
  return lignes.map((ligne) => `• ${ligne}`).join('\n');
}

function option(libelle: string, confusion: ConfusionId | null) {
  return { id: slugOption(libelle), libelle, confusion };
}

export function vote(
  id: string,
  concept: ConceptId,
  noteCompte: boolean,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUn<Piege>,
  segments: readonly string[] = [],
): VoteDuCours {
  const [premier, ...suite] = pieges;
  return {
    type: 'vote',
    id,
    concept,
    noteCompte,
    enonce,
    options: [
      option(bonne, null),
      option(...premier),
      ...suite.map((piege) => option(...piege)),
    ],
    segments: [...segments],
  };
}

export function numerique(
  id: string,
  concept: ConceptId,
  enonce: string,
  unite: string | null,
  solution: number,
  tolerance: NumeriqueDuCours['tolerance'],
  formePubliee: string,
  pieges: AuMoinsUn<readonly [number, ConfusionId]>,
): NumeriqueDuCours {
  return {
    type: 'numeric',
    id,
    concept,
    noteCompte: true,
    enonce,
    unite,
    solution,
    tolerance,
    formePubliee,
    pieges: mapper(pieges, ([valeur, confusion]) => ({ valeur, confusion })),
  };
}

export function ecranV2(
  socle: SocleDEcran,
  renderer: string,
  props: Readonly<Record<string, unknown>>,
  reserve: ReserveDuRecit = {},
): EcranDeRecit {
  return {
    ...socle,
    brique: 'fp-story',
    proprietes: {
      presentation: { version: 2, screenId: socle.screenId, renderer, props },
      ...reserve,
    },
  };
}

interface Carte {
  readonly id: string;
  readonly libelle: string;
  readonly categorie: string;
  readonly confusion: ConfusionId;
  readonly justification: string;
}

export function classement(
  plan: {
    readonly id: string;
    readonly intitule: string;
    readonly dureeJeuMs?: number;
  },
  concept: ConceptId,
  categories: AuMoinsUn<readonly [string, string]>,
  cartes: AuMoinsUn<Carte>,
): Pick<ProprietesDeClassement, 'plan' | 'questions'> {
  return {
    plan: {
      ...plan,
      cartes: mapper(cartes, (carte) => ({
        id: carte.id,
        libelle: carte.libelle,
      })),
      categories: mapper(categories, ([id, libelle]) => ({ id, libelle })),
    },
    questions: [
      {
        type: 'classement',
        id: plan.id,
        concept,
        noteCompte: true,
        corrige: {
          type: 'classement',
          attendus: mapper(cartes, (carte) => ({
            carteId: carte.id,
            categorieId: carte.categorie,
            confusionSiErreur: carte.confusion,
            justification: carte.justification,
          })),
          seuilReussite: 0.75,
        },
      },
    ],
  };
}

export function suiviDeSaCorrection(
  { sousTitre, intitule = 'Correction du tri', ...socle }: CorrectionDeTri,
  tri: EcranDeTri,
): [EcranDeTri, EcranDeRecit] {
  const {
    plan,
    questions: [{ corrige }],
  } = tri.proprietes;
  const attendus = new Map(
    corrige.attendus.map((attendu) => [attendu.carteId, attendu]),
  );
  return [
    tri,
    ecranV2({ ...socle, diffusion: 'seance' }, 'sort-review', {
      title: intitule,
      subtitle: sousTitre,
      source: { screenId: tri.screenId, sortId: plan.id },
      categories: plan.categories.map(({ id, libelle }) => ({
        id,
        label: libelle,
      })),
      cards: plan.cartes.map(({ id, libelle }) => ({
        id,
        label: libelle,
        category: attendus.get(id)?.categorieId,
        justification: attendus.get(id)?.justification,
      })),
    }),
  ];
}

export function correctionDesReponses(
  { sousTitre, ...socle }: CorrectionDeReponses,
  source: string,
  explications: AuMoinsUn<readonly [string, string]>,
): EcranDeRecit {
  return ecranV2({ ...socle, diffusion: 'seance' }, 'answer-review', {
    title: socle.titre,
    ...(sousTitre === undefined ? {} : { subtitle: sousTitre }),
    source: { screenId: source },
    explications: explications.map(([reference, texte]) => ({
      reference,
      texte,
    })),
  });
}

export function suiviDeSonCorrige(
  socle: Omit<SocleDEcran, 'diffusion'>,
  exercice: EcranDExemple,
): [EcranDExemple, EcranDExemple] {
  const { exemple } = exercice.proprietes;
  return [
    exercice,
    {
      ...socle,
      diffusion: 'seance',
      brique: 'fp-worked',
      proprietes: {
        exemple: { ...exemple, id: `${exemple.id}-corrige` },
        etayage: 0,
        pilote: true,
        corrigeDe: exercice.screenId,
      },
    },
  ];
}

export function strategie(id: string, libelle: string, fausse = false) {
  return { id, libelle, fausse };
}

export function attendu(
  reference: string,
  formuleReference: string,
  valeur: number,
  forme: 'references' | { readonly memeQue: string },
  pieges: readonly (readonly [number, ConfusionId])[] = [],
  confusionSiErreurFormule: ConfusionId | null = null,
  tolerance:
    | typeof TOLERANCE_RELATIVE
    | typeof TOLERANCE_NULLE = TOLERANCE_RELATIVE,
) {
  return {
    reference,
    formuleReference,
    valeur,
    tolerance,
    forme,
    confusionSiErreurFormule,
    pieges: pieges.map(([valeurDuPiege, confusion]) => ({
      valeur: valeurDuPiege,
      confusion,
    })),
  };
}

export function enigme(
  parcoursId: string,
  rang: number,
  id: string,
  concept: ConceptId,
  valeur: number,
  tolerance: number,
  formePubliee: string,
  fragment: string,
  pieges: AuMoinsUn<readonly [number, ConfusionId]>,
) {
  return {
    type: 'enigme' as const,
    id,
    concept,
    noteCompte: false,
    corrige: {
      type: 'enigme' as const,
      parcoursId,
      enigmeId: id,
      rang,
      solution: {
        type: 'nombre' as const,
        valeur,
        tolerance: { type: 'absolue' as const, valeur: tolerance },
        formePubliee,
      },
      fragment,
      pieges: mapper(pieges, ([valeurDuPiege, confusion]) => ({
        valeur: valeurDuPiege,
        confusion,
      })),
    },
  };
}

export function rappel(
  id: string,
  concept: ConceptId,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUn<Piege>,
): VoteDuCours {
  return vote(id, concept, false, enonce, bonne, pieges);
}
