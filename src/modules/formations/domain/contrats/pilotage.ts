import type { LiveSessionState as LiveSessionStateServi } from '../ISessionStateCache.port';
import type { FreeRange, PacingMode } from '../PacingMode';
import type { ValeurReponse } from './resultats';

export const ETATS_PULSE = ['perdu', 'ca-va', 'clair'] as const;

export type EtatPulse = (typeof ETATS_PULSE)[number];

export const PHASES_DE_VOTE = [
  'vote',
  'discussion',
  'revote',
  'revele',
] as const;

export type VotePhase = (typeof PHASES_DE_VOTE)[number];

export interface PilotageEcran {
  readonly phase?: VotePhase;
  readonly revele?: boolean;
  readonly etayage?: number;
  readonly etayageAtteint?: number;
  readonly reglages?: Readonly<Record<string, number>>;
  readonly resultatsProjetes?: boolean;
  readonly optionsAffichees?: boolean;
}

export type PilotageDemande = { readonly screenId: string } & Omit<
  PilotageEcran,
  'etayageAtteint'
>;

export interface LiveSessionState extends LiveSessionStateServi {
  revision: number;
  pilotage: Readonly<Record<string, PilotageEcran>>;
}

export interface ControlSessionChanges {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange | null;
  pilotage?: PilotageDemande;
}

export interface EtatParticipant {
  readonly sessionId: string;
  readonly participantId: string;
  readonly revision: number;
  readonly reponses: readonly {
    readonly questionId: string;
    readonly valeur: ValeurReponse;
    readonly correcte: boolean;
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
  readonly enigmes: readonly {
    readonly parcoursId: string;
    readonly resolues: readonly {
      readonly enigmeId: string;
      readonly fragment: string;
    }[];
    readonly tentativesRestantes: Readonly<Record<string, number>>;
  }[];
  readonly defis: readonly {
    readonly defiId: string;
    readonly premiereTentative: string;
  }[];
  readonly rappels: { readonly questionIds: readonly string[] };
}
