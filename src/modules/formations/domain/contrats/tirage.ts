import type { Solution } from '../GradingCore';
import type {
  CoursPublic as CoursPublicActuel,
  EcranPublic as EcranPublicActuel,
} from '../cours/CoursPublic';
import type { CorrigeTire, LibellesDesOptions } from '../cours/Tirage';
import type { VotePublic } from './donnees-publiques';

export interface EcranPublic extends EcranPublicActuel {
  readonly titre: string | null;
}

export interface CoursPublic extends Omit<CoursPublicActuel, 'ecrans'> {
  readonly ecrans: readonly EcranPublic[];
}

export interface CoursPublicCatalogue extends CoursPublic {
  readonly version: number;
  readonly publieLe: string;
}

export interface TirageDuCours {
  readonly sujet: CoursPublic;
  readonly solutions: Readonly<Record<string, Solution>>;
  readonly corriges: Readonly<Record<string, CorrigeTire>>;
  readonly libellesOptions: LibellesDesOptions;
  readonly banque: Readonly<Record<string, VotePublic>>;
}
