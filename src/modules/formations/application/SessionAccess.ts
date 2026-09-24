import { ParticipantNotFoundError } from '../domain/errors/FormationErrors';
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

export async function agirSurUnParticipant(
  sessions: ISessionsRepository,
  acces: { sessionId: string; teacherId: string; participantId: string },
  action: (session: SessionRecord) => Promise<boolean>,
): Promise<void> {
  const session = await seancePilotablePar(
    sessions,
    acces.sessionId,
    acces.teacherId,
  );
  if (!(await action(session))) {
    throw new ParticipantNotFoundError(acces.participantId);
  }
}
