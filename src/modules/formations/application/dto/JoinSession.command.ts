import type { PacingMode } from '../../domain/PacingMode';

export interface JoinSessionCommand {
  code: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
}

export interface JoinSessionResult {
  participantId: string;
  sessionId: string;
  seed: number;
  ecranCourant: number;
  modeRythme: PacingMode;
}
