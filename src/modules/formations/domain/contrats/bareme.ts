import type { Bareme as BaremeV1 } from '../notation/Bareme';
import type { Solution, Tolerance } from '../notation/GradingCore';
import type { ConceptId } from '../cours/banque/concepts';
import type { CorrigeProduction } from '../cours/correction/Corrige';
import type { TypeQuestion } from './cours';

export type { BaremeV1 };

export interface BaremeQuestionV2 {
  readonly id: string;
  readonly type: TypeQuestion;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly ecranId: string;
  readonly rangEcran: number;
  readonly tolerance?: Tolerance;
  readonly ouverture?: 'principale' | 'jumelle';
  readonly origine?: 'banque';
  readonly parcoursId?: string;
  readonly rangEnigme?: number;
}

export interface BaremeV2 {
  readonly version: 2;
  readonly graineReference: number;
  readonly questions: readonly BaremeQuestionV2[];
  readonly solutionsCommunes: Readonly<Record<string, Solution>>;
  readonly tirages: readonly {
    readonly seed: number;
    readonly ecarts: Readonly<Record<string, Solution>>;
  }[];
  readonly corriges: Readonly<Record<string, CorrigeProduction>>;
}

export type Bareme = BaremeV1 | BaremeV2;
