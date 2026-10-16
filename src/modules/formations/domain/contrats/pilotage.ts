import type {
  EtatPulse,
  FreeRange,
  PacingMode,
  VotePhase,
} from './contrat-de-l-api';
import type { SortiesMachine } from './donnees-publiques';
import type { ValeurReponse } from './resultats';

export {
  ETATS_PULSE,
  PHASES_DE_VOTE,
  type EtatPulse,
  type VotePhase,
} from './contrat-de-l-api';

export interface PilotageEcran {
  readonly phase?: VotePhase;
  readonly revele?: boolean;
  readonly etayage?: number;
  readonly etayageAtteint?: number;
  readonly explicationsDevoilees?: number;
  readonly reglages?: Readonly<Record<string, number>>;
  readonly resultatsProjetes?: boolean;
  readonly optionsAffichees?: boolean;
}

export interface PilotageServi extends PilotageEcran {
  readonly sortiesProjetees?: SortiesMachine;
  readonly questionAffichee?: string;
  readonly questionOuverte?: string | null;
}

export type PilotageDemande = { readonly screenId: string } & Omit<
  PilotageEcran,
  'etayageAtteint'
>;

export type { LiveSessionState } from '../ISessionStateCache.port';

export interface ControlSessionChanges {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange | null;
  pilotage?: PilotageDemande;
}

export const ETATS_D_ENIGME = Object.freeze([
  'resolue',
  'epuisee',
  'ouverte',
  'verrouillee',
] as const);
export type EtatEnigme = (typeof ETATS_D_ENIGME)[number];

export interface EtatDesEnigmes {
  readonly etats: Readonly<
    Record<
      string,
      { readonly etat: EtatEnigme; readonly tentativesRestantes: number }
    >
  >;
  readonly enigmeOuverte: string | null;
  readonly acheve: boolean;
}

export interface EtatParticipant {
  readonly sessionId: string;
  readonly participantId: string;
  readonly revision: number;
  readonly reponses: readonly {
    readonly questionId: string;
    readonly valeur: ValeurReponse;
    readonly correcte: boolean | null;
    readonly score: number | null;
    readonly details:
      | readonly {
          readonly cle: string;
          readonly juste: boolean;
          readonly libelleConfusion: string | null;
        }[]
      | null;
    readonly libelleConfusion: string | null;
  }[];
  readonly reponsesLibres: readonly {
    readonly activityId: string;
    readonly response: string;
  }[];
  readonly jalons: readonly {
    readonly sondageId: string;
    readonly etat: EtatPulse;
  }[];
  readonly enigmes: readonly (EtatDesEnigmes & {
    readonly parcoursId: string;
    readonly resolues: readonly {
      readonly enigmeId: string;
      readonly fragment: string;
    }[];
    readonly tentativesRestantes: Readonly<Record<string, number>>;
  })[];
  readonly defis: readonly {
    readonly defiId: string;
    readonly premiereTentative: string;
  }[];
  readonly rappels: { readonly questionIds: readonly string[] };
}
