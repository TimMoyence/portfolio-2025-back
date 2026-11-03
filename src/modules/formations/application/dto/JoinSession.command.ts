import type { PacingMode } from '../../domain/seance/etat/PacingMode';

export interface JoinSessionCommand {
  code: string;
  prenom: string;
  nom: string;
  email: string;
  secretDeReprise?: string;
}

export interface JoinSessionResult {
  participantId: string;
  generationDeJeton: number;
  sessionId: string;
  secretDeReprise: string;
  seed: number;
  ecranCourant: number;
  modeRythme: PacingMode;
}
