import type { FreeRange, PacingMode } from './PacingMode';
import type { SessionState } from './SessionState';

export interface LiveSessionState {
  etat: SessionState;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
  majLe: Date;
}

export interface ISessionStateCache {
  publish(sessionId: string, state: LiveSessionState): void;
  read(sessionId: string): LiveSessionState | null;
  drop(sessionId: string): void;
  fingerprint(state: LiveSessionState): string;
}
