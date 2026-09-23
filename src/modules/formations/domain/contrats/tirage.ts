import type { Solution } from '../GradingCore';
import type {
  CoursPublic as CoursPublicActuel,
  EcranPublic as EcranPublicActuel,
} from '../cours/CoursPublic';
import type { CorrigeTire, LibellesDesOptions } from '../cours/Tirage';
import type { CorrigeEcranPresentateur } from './deroule';
import type { VotePublic } from './donnees-publiques';

export interface CorrectionServie {
  readonly ecranId: string;
  readonly questions: readonly {
    readonly questionId: string;
    readonly bonneReponse: string;
    readonly optionId: string | null;
  }[];
  readonly corrige: CorrigeEcranPresentateur | null;
  readonly reflexion: {
    readonly attendu: string;
    readonly suite: string | null;
  } | null;
}

export interface EcranPublic extends EcranPublicActuel {
  readonly titre: string | null;
  readonly renvoi?: string;
  readonly ecranCorrige?: string;
  readonly correction?: CorrectionServie;
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
