import type { Bareme } from '../../domain/Bareme';

export interface OpenSessionCommand {
  courseSlug: string;
  teacherId: string;
  bareme: Bareme;
}

export interface OpenSessionResult {
  sessionId: string;
  code: string;
}
