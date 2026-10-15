import type { AuMoinsUn } from '../../../../common/domain/au-moins-un';
import type { Tolerance } from '../GradingCore';
import type { SheetPlanStocke } from '../contrats/cours';
import type { FormeFormule } from 'portfolio-2025-partage/contrats';
import type { ValeurFormule } from 'portfolio-2025-partage/formule';
import type { ConfusionId } from './banque/confusions';

export type { FormeFormule } from 'portfolio-2025-partage/contrats';

export interface PiegeNumerique {
  readonly valeur: number;
  readonly confusion: ConfusionId;
}

export interface CorrigeFeuille {
  readonly type: 'feuille';
  readonly plan: SheetPlanStocke;
  readonly attendus: AuMoinsUn<{
    readonly reference: string;
    readonly formuleReference: string;
    readonly valeur: ValeurFormule;
    readonly tolerance: Tolerance;
    readonly forme: FormeFormule;
    readonly confusionSiErreurFormule: ConfusionId | null;
    readonly pieges: readonly PiegeNumerique[];
  }>;
}

export interface CorrigeTableau {
  readonly type: 'tableau';
  readonly attendus: AuMoinsUn<{
    readonly rang: number;
    readonly cle: string;
    readonly valeur: number;
    readonly pieges: readonly PiegeNumerique[];
  }>;
  readonly tolerance: Tolerance;
}

export interface PiegeDeClassement {
  readonly categorieId: string;
  readonly confusion: ConfusionId;
}

export interface CorrigeClassement {
  readonly type: 'classement';
  readonly attendus: AuMoinsUn<{
    readonly carteId: string;
    readonly categorieId: string;
    readonly pieges: readonly PiegeDeClassement[];
    readonly justification: string;
  }>;
}

export interface CorrigeEnigme {
  readonly type: 'enigme';
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly rang: number;
  readonly solution:
    | {
        readonly type: 'nombre';
        readonly valeur: number;
        readonly tolerance: Tolerance;
        readonly formePubliee: string;
      }
    | { readonly type: 'texte'; readonly acceptees: AuMoinsUn<string> };
  readonly fragment: string;
  readonly pieges: readonly PiegeNumerique[];
}

export interface CorrigeDefi {
  readonly type: 'defi';
  readonly strategies: AuMoinsUn<{
    readonly id: string;
    readonly libelle: string;
    readonly fausse: boolean;
  }>;
}

export interface CorrigeRevelation {
  readonly type: 'revelation';
  readonly titre: string;
  readonly lignes: AuMoinsUn<string>;
}

export type CorrigeProduction =
  | CorrigeFeuille
  | CorrigeTableau
  | CorrigeClassement
  | CorrigeEnigme;
