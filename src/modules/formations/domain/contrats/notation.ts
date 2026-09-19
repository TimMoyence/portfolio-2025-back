import type { RegleDeNotation as RegleDeNotationServie } from '../RegleDeNotation';
import type { TypeQuestion } from './cours';

export interface RegleDeNotation extends RegleDeNotationServie {
  readonly typesNotables: readonly TypeQuestion[];
  readonly productionCompteSi: 'au-moins-une-saisie';
  readonly statistiquesSurQuestionsNotees: boolean;
}
