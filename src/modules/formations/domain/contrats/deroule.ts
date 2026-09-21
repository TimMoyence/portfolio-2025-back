import type { Tolerance } from '../GradingCore';
import type { Ecran as EcranActuel } from '../cours/Cours';
import type { FormeFormule } from '../cours/Corrige';
import type { CorrigePresentateur } from '../cours/DeroulePresentateur';
import type { Diffusion } from './cours';
import type { CoursPublic, EcranPublic } from './tirage';

export interface EcranDeroule extends EcranPublic {
  readonly notes: string;
  readonly diffusion: Diffusion;
  readonly seuil: number | null;
  readonly corriges: readonly CorrigePresentateur[];
  readonly questions: readonly {
    readonly id: string;
    readonly enonce: string;
    readonly options:
      | readonly { readonly id: string; readonly libelle: string }[]
      | null;
  }[];
  readonly corrigeEcran: CorrigeEcranPresentateur | null;
  readonly guide?: NonNullable<EcranActuel['guide']>;
}

export type CorrigeEcranPresentateur =
  | {
      readonly type: 'feuille';
      readonly attendus: readonly {
        readonly reference: string;
        readonly formuleReference: string;
        readonly valeur: number;
        readonly tolerance: Tolerance;
        readonly forme: FormeFormule;
      }[];
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'tableau';
      readonly attendus: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
      readonly tolerance: Tolerance;
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'classement';
      readonly attendus: readonly {
        readonly carteId: string;
        readonly categorieId: string;
        readonly justification: string;
      }[];
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'enigmes';
      readonly enigmes: readonly {
        readonly enigmeId: string;
        readonly solution: string;
        readonly fragment: string;
      }[];
      readonly codeFinal: string;
    }
  | {
      readonly type: 'defi';
      readonly strategies: readonly {
        readonly id: string;
        readonly libelle: string;
        readonly fausse: boolean;
      }[];
    }
  | {
      readonly type: 'revelation';
      readonly titre: string;
      readonly lignes: readonly string[];
    };

export interface DerouleCours extends Omit<CoursPublic, 'ecrans'> {
  readonly ecrans: readonly EcranDeroule[];
  readonly remediations: Readonly<Record<string, string>>;
}
