import type { Tolerance } from '../GradingCore';
import type { ConceptId } from '../cours/banque/concepts';
import type { ConfusionId } from '../cours/banque/confusions';
import type {
  AuMoinsUn,
  Cours as CoursActuel,
  Ecran as EcranActuel,
  QuestionNumerique,
  QuestionVote,
  RegimeVerrou,
  SocleHistorique,
} from '../cours/Cours';
import type {
  CorrigeDefi,
  CorrigeProduction,
  CorrigeRevelation,
} from '../cours/Corrige';
import type {
  CardsortPlanPublic,
  EscapeParcoursPublic,
  SheetPlanPublic,
  TableBuildPlanPublic,
  WorkedExemple,
} from './donnees-publiques';

export const DIFFUSIONS = ['catalogue', 'seance'] as const;
export type Diffusion = (typeof DIFFUSIONS)[number];
export type OrdreQuestions = 'fixe' | 'melange';
export const TYPES_QUESTION = [
  'numeric',
  'vote',
  'feuille',
  'tableau',
  'classement',
  'enigme',
] as const;
export type TypeQuestion = (typeof TYPES_QUESTION)[number];

export type SheetPlanStocke = Omit<SheetPlanPublic, 'metadonnees'>;
export type CardsortPlanStocke = Omit<CardsortPlanPublic, 'metadonnees'>;
export type TableBuildPlanStocke = Omit<TableBuildPlanPublic, 'metadonnees'>;
export type EscapeParcoursStocke = Omit<EscapeParcoursPublic, 'metadonnees'>;

interface LigneDuDossier {
  readonly libelle: string;
  readonly valeur: string;
}

export interface ProblemeStocke {
  readonly id: string;
  readonly enonce: string;
  readonly invite: string;
  readonly rappel?: AuMoinsUn<LigneDuDossier>;
}

type ProprietesActuelles<B extends EcranActuel['brique']> =
  Extract<EcranActuel, { readonly brique: B }> extends {
    readonly proprietes: infer P;
  }
    ? P
    : never;

type Prereglages = readonly {
  readonly libelle: string;
  readonly valeurs: Readonly<Record<string, number>>;
}[];

type Animation = readonly Readonly<Record<string, number>>[];

export interface ProprietesExposition {
  readonly 'fp-quote': ProprietesActuelles<'fp-quote'>;
  readonly 'fp-story': ProprietesActuelles<'fp-story'>;
  readonly 'fp-pro': ProprietesActuelles<'fp-pro'>;
  readonly 'fp-worked': {
    readonly exemple: Omit<WorkedExemple, 'metadonnees'>;
    readonly etayage: number;
    readonly pilote?: boolean;
    readonly corrigeDe?: string;
  };
  readonly 'fp-concept4': ProprietesActuelles<'fp-concept4'> & {
    readonly prereglages?: Prereglages;
    readonly animation?: Animation;
  };
  readonly 'fp-plot': ProprietesActuelles<'fp-plot'> & {
    readonly bornesOrdonnee?: {
      readonly min?: number;
      readonly max?: number;
      readonly minParametre?: string;
      readonly maxParametre?: string;
    };
    readonly sourceUrl?: string;
    readonly description?: string;
    readonly forme?: 'courbes' | 'barres';
    readonly unite?: 'euros';
    readonly etiquettes?: readonly string[];
    readonly prereglages?: Prereglages;
    readonly reference?: string;
    readonly animation?: Animation;
  };
  readonly 'fp-pulse': {
    readonly sondage: { readonly id: string; readonly invite: string };
  };
}

export const PARTS_DU_RENVOI = [30, 40, 50, 60, 70] as const;

export const CHAMPS_EXTRAITS_DU_CAS = [
  'metier',
  'situation',
  'geste',
  'consequence',
] as const;

export interface CadrageDuRenvoi {
  readonly part: (typeof PARTS_DU_RENVOI)[number];
  readonly extrait?: {
    readonly lignes?: readonly number[];
    readonly champs?: readonly (typeof CHAMPS_EXTRAITS_DU_CAS)[number][];
  };
}

interface EcranCommun extends SocleHistorique {
  readonly titre: string | null;
  readonly diffusion: Diffusion;
}

type EcranExposition = {
  [B in keyof ProprietesExposition]: EcranCommun & {
    readonly brique: B;
    readonly proprietes: ProprietesExposition[B];
  };
}[keyof ProprietesExposition];

export type Ecran =
  | EcranExposition
  | (Omit<EcranCommun, 'question'> & {
      readonly brique: 'fp-numeric';
      readonly question: QuestionNumerique;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-vote';
      readonly question: QuestionVote;
      readonly questionJumelle?: QuestionVote;
      readonly revelation?: CorrigeRevelation;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-recall';
      readonly question: QuestionVote;
      readonly delaiMs: number;
      readonly consigne?: string;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-exit';
      readonly question: QuestionVote;
      readonly invite: string;
    })
  | (EcranCommun & {
      readonly brique: 'questionnaire';
      readonly intitule: string;
      readonly consigne: string;
      readonly regime: RegimeVerrou;
      readonly ordre: OrdreQuestions;
      readonly questions: AuMoinsUn<QuestionVote | QuestionNumerique>;
    })
  | (EcranCommun & {
      readonly brique: 'fp-sheet';
      readonly proprietes: { readonly plan: SheetPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-table-build';
      readonly proprietes: { readonly plan: TableBuildPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-cardsort';
      readonly proprietes: { readonly plan: CardsortPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-escape';
      readonly proprietes: { readonly parcours: EscapeParcoursStocke };
      readonly enigmes: AuMoinsUn<QuestionProduction>;
    })
  | (EcranCommun & {
      readonly brique: 'fp-challenge';
      readonly proprietes: { readonly probleme: ProblemeStocke };
      readonly defi: CorrigeDefi;
    })
  | (EcranCommun & {
      readonly brique: 'fp-spaced';
      readonly proprietes: {
        readonly rappel: { readonly id: string; readonly intitule: string };
      };
      readonly banque: AuMoinsUn<QuestionVote>;
      readonly obligatoires: readonly string[];
    });

export interface MediaCatalogue {
  readonly id: string;
  readonly chemins: AuMoinsUn<string>;
  readonly pageSource: string | null;
  readonly auteur: string;
  readonly date: string;
  readonly licence: string;
  readonly attribution: string;
}

export interface Cours extends Omit<CoursActuel, 'ecrans'> {
  readonly ecrans: AuMoinsUn<Ecran>;
  readonly medias: readonly MediaCatalogue[];
}

export interface QuestionProduction {
  readonly id: string;
  readonly type: 'feuille' | 'tableau' | 'classement' | 'enigme';
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly confusions: AuMoinsUn<ConfusionId>;
  readonly corrige: CorrigeProduction;
}

export type Question = QuestionNumerique | QuestionVote | QuestionProduction;

export interface OptionStockee {
  readonly id: string;
  readonly libelle: string;
  readonly confusion: ConfusionId | null;
}

export interface VoteStockee {
  readonly type: 'vote';
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly enonce: string;
  readonly options: AuMoinsUn<OptionStockee>;
  readonly segments: readonly string[];
}

export interface NumeriqueStockee {
  readonly type: 'numeric';
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly enonce: string;
  readonly unite: string | null;
  readonly solution: number;
  readonly tolerance: Tolerance;
  readonly formePubliee: string;
  readonly pieges: AuMoinsUn<{
    readonly valeur: number;
    readonly confusion: ConfusionId;
  }>;
}
