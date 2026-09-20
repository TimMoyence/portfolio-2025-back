import type { Bareme } from './contrats/bareme';
import type { PilotageEcran } from './contrats/pilotage';
import type { FreeRange, PacingMode } from './PacingMode';
import type { SessionState } from './SessionState';

export interface SessionRecord {
  id: string;
  courseSlug: string;
  courseVersion: number;
  teacherId: string;
  code: string;
  etat: SessionState;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  pilotageEcrans: Readonly<Record<string, PilotageEcran>>;
  revision: number;
  capacite: number;
  bareme: Bareme;
  ouverteLe: Date;
  fermeeLe: Date | null;
  majLe: Date;
}

export interface EtatDeSeanceRecord {
  readonly etat: SessionState;
  readonly modeRythme: PacingMode;
  readonly ecranCourant: number;
  readonly intervalleLibre: FreeRange | null;
  readonly pilotageEcrans: Readonly<Record<string, PilotageEcran>>;
  readonly revision: number;
  readonly majLe: Date;
}

export interface CreateSessionInput {
  courseSlug: string;
  courseVersion: number;
  teacherId: string;
  code: string;
  bareme: Bareme;
  capacite?: number;
}

export interface UpdateSessionInput {
  etat?: SessionState;
  modeRythme?: PacingMode;
  ecranCourant?: number;
  intervalleLibre?: FreeRange | null;
  pilotageEcrans?: Readonly<Record<string, PilotageEcran>>;
  fermeeLe?: Date | null;
}

export interface ISessionsRepository {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  findById(id: string): Promise<SessionRecord | null>;
  lireEtat(id: string): Promise<EtatDeSeanceRecord | null>;
  findActiveByCode(code: string): Promise<SessionRecord | null>;
  isCodeTaken(code: string): Promise<boolean>;
  update(id: string, input: UpdateSessionInput): Promise<SessionRecord>;
}
