import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import {
  assertSessionOwnedBy,
  assertSessionReadableBy,
} from '../domain/SessionOwnership';
import type { ActeurFormation } from '../domain/SessionOwnership';

export async function seanceLisiblePar(
  sessions: ISessionsRepository,
  sessionId: string,
  acteur: ActeurFormation,
): Promise<SessionRecord> {
  return assertSessionReadableBy(
    await sessions.findById(sessionId),
    sessionId,
    acteur,
  );
}

export async function seancePilotablePar(
  sessions: ISessionsRepository,
  sessionId: string,
  teacherId: string,
): Promise<SessionRecord> {
  return assertSessionOwnedBy(
    await sessions.findById(sessionId),
    sessionId,
    teacherId,
  );
}
