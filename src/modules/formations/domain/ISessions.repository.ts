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
  bareme: Bareme;
  ouverteLe: Date;
  fermeeLe: Date | null;
  majLe: Date;
}

export interface CreateSessionInput {
  courseSlug: string;
  courseVersion: number;
  teacherId: string;
  code: string;
  bareme: Bareme;
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
  findActiveByCode(code: string): Promise<SessionRecord | null>;
  isCodeTaken(code: string): Promise<boolean>;
  update(id: string, input: UpdateSessionInput): Promise<SessionRecord>;
}
