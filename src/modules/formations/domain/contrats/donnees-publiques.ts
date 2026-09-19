import type { Modalite, RegimeVerrou } from '../cours/Cours';
import type { OrdreQuestions, ProprietesExposition } from './cours';

export interface MetadonneesBrique {
  readonly concepts: readonly string[];
  readonly misconceptionsCiblees: readonly string[];
  readonly dureeMinutes: number;
  readonly modalite: Modalite;
  readonly regime: RegimeVerrou;
}

export interface OptionPublique {
  readonly id: string;
  readonly libelle: string;
}

export interface VotePublic {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

export interface NumeriquePublic {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
  readonly metadonnees: MetadonneesBrique;
}

export interface ExitBilletPublic {
  readonly id: string;
  readonly question: string;
  readonly invite: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface WorkedExemple {
  readonly id: string;
  readonly enonce: string;
  readonly etapes: readonly {
    readonly id: string;
    readonly intitule: string;
    readonly raisonnement: string;
    readonly invite: string;
  }[];
  readonly metadonnees: MetadonneesBrique;
}

type DefinitionPublique<P> = P & {
  readonly id: string;
  readonly metadonnees: MetadonneesBrique;
};

export type Concept4Definition = DefinitionPublique<
  ProprietesExposition['fp-concept4']
>;

export type PlotDefinition = DefinitionPublique<
  ProprietesExposition['fp-plot']
>;

export interface SheetPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
  readonly consignes: readonly string[];
  readonly metadonnees: MetadonneesBrique;
}

export interface CardsortPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly cartes: readonly OptionPublique[];
  readonly categories: readonly OptionPublique[];
  readonly dureeJeuMs?: number;
  readonly metadonnees: MetadonneesBrique;
}

export interface TableColonneServie {
  readonly cle: string;
  readonly intitule: string;
  readonly role: 'donnee' | 'saisie' | 'deduite';
  readonly decimales: number;
  readonly valeurs?: readonly number[];
  readonly formule?: string;
  readonly formuleInitiale?: string;
  readonly soldeDe?: string;
  readonly totalise: boolean;
}

export interface TableBuildPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly consignes: readonly string[];
  readonly echeances: number;
  readonly libellesLignes: readonly string[];
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonneServie[];
  readonly synthese: readonly {
    readonly libelle: string;
    readonly formule: string;
    readonly unite: string | null;
    readonly decimales: number;
  }[];
  readonly metadonnees: MetadonneesBrique;
}

export interface EscapeParcoursPublic {
  readonly id: string;
  readonly intitule: string;
  readonly delaiIndiceMs: number;
  readonly budgetEnigmeMs: number;
  readonly tentativesMax: number;
  readonly enigmes: readonly {
    readonly id: string;
    readonly intitule: string;
    readonly enonce: string;
    readonly indice: string;
  }[];
  readonly metadonnees: MetadonneesBrique;
}

export interface PulseSondage {
  readonly id: string;
  readonly invite: string;
  readonly metadonnees: MetadonneesBrique;
}

export interface SpacedQuestionPublique {
  readonly questionId: string;
  readonly concept: string;
  readonly boite: 1 | 2 | 3;
  readonly cours: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

export interface StoryRecit {
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly visuel?: {
    readonly src: string;
    readonly alt: string;
    readonly legende?: string;
    readonly source?: string;
  };
  readonly video?: {
    readonly src: string;
    readonly srcPoste?: string;
    readonly type: 'video/webm' | 'video/mp4';
    readonly titre: string;
    readonly poster?: string;
    readonly transcript: string;
    readonly source: string;
    readonly licence: string;
    readonly sousTitres?: {
      readonly src: string;
      readonly srclang: string;
      readonly libelle: string;
    };
    readonly preload?: 'none' | 'metadata';
  };
  readonly metadonnees: MetadonneesBrique;
}

type QuestionDeQuestionnaire =
  | {
      readonly brique: 'fp-numeric';
      readonly donnees: DonneesParBrique['fp-numeric'];
    }
  | {
      readonly brique: 'fp-vote';
      readonly donnees: DonneesParBrique['fp-vote'];
    };

export interface DonneesParBrique {
  readonly 'fp-story': { readonly recit: StoryRecit };
  readonly 'fp-pro': {
    readonly cas: {
      readonly id: string;
      readonly metier: string;
      readonly situation: string;
      readonly geste: string;
      readonly consequence: string | null;
      readonly metadonnees: MetadonneesBrique;
    };
  };
  readonly 'fp-worked': {
    readonly exemple: WorkedExemple;
    readonly etayage: number;
  };
  readonly 'fp-concept4': { readonly definition: Concept4Definition };
  readonly 'fp-plot': { readonly definition: PlotDefinition };
  readonly 'fp-challenge': {
    readonly probleme: {
      readonly id: string;
      readonly enonce: string;
      readonly invite: string;
      readonly strategies: readonly [];
      readonly metadonnees: MetadonneesBrique;
    };
  };
  readonly 'fp-cardsort': { readonly plan: CardsortPlanPublic };
  readonly 'fp-sheet': { readonly plan: SheetPlanPublic };
  readonly 'fp-table-build': { readonly plan: TableBuildPlanPublic };
  readonly 'fp-escape': { readonly parcours: EscapeParcoursPublic };
  readonly 'fp-pulse': { readonly sondage: PulseSondage };
  readonly 'fp-spaced': {
    readonly rappel: {
      readonly id: string;
      readonly intitule: string;
      readonly metadonnees: MetadonneesBrique;
    };
  };
  readonly 'fp-numeric': { readonly question: NumeriquePublic };
  readonly 'fp-vote': {
    readonly question: VotePublic;
    readonly questionJumelle?: VotePublic;
  };
  readonly 'fp-recall': {
    readonly question: VotePublic & { readonly metadonnees: MetadonneesBrique };
    readonly delaiMs: number;
  };
  readonly 'fp-exit': { readonly billet: ExitBilletPublic };
  readonly questionnaire: {
    readonly intitule: string;
    readonly consigne: string;
    readonly regime: RegimeVerrou;
    readonly ordre: OrdreQuestions;
    readonly questions: readonly QuestionDeQuestionnaire[];
  };
  readonly 'ecran-verrouille': Readonly<Record<string, never>>;
}
