import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from './errors/FormationErrors';
import type { SessionRecord } from './ISessions.repository';

export function assertSessionOwnedBy(
  session: SessionRecord | null,
  sessionId: string,
  teacherId: string,
): SessionRecord {
  if (!session) {
    throw new SessionNotFoundError(sessionId);
  }
  if (session.teacherId !== teacherId) {
    throw new SessionNotOwnedError(sessionId);
  }
  return session;
}
