import {
  ParticipantNotFoundError,
  RevisionDeSeanceObsoleteError,
} from '../../../domain/errors/FormationErrors';
import type {
  ISessionsRepository,
  SessionRecord,
  UpdateSessionInput,
} from '../../../domain/seance/acces/ISessions.repository';
import {
  assertSessionOwnedBy,
  assertSessionReadableBy,
} from '../../../domain/seance/acces/SessionOwnership';
import type { ActeurFormation } from '../../../domain/seance/acces/SessionOwnership';
import { assertSeanceNonTerminee } from '../../../domain/seance/etat/SessionState';

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

async function seanceNonTermineePilotablePar(
  sessions: ISessionsRepository,
  sessionId: string,
  teacherId: string,
): Promise<SessionRecord> {
  const session = await seancePilotablePar(sessions, sessionId, teacherId);
  assertSeanceNonTerminee(session.etat);
  return session;
}

const TENTATIVES_SUR_REVISION_OBSOLETE = 5;

export async function ecrireSurLaRevisionLue(
  sessions: ISessionsRepository,
  acces: { sessionId: string; teacherId: string },
  ecriture: (session: SessionRecord) => Promise<UpdateSessionInput>,
): Promise<SessionRecord> {
  for (
    let tentative = 0;
    tentative < TENTATIVES_SUR_REVISION_OBSOLETE;
    tentative += 1
  ) {
    const session = await seanceNonTermineePilotablePar(
      sessions,
      acces.sessionId,
      acces.teacherId,
    );
    const misAJour = await ecriture(session);
    try {
      return await sessions.update(acces.sessionId, misAJour, session.revision);
    } catch (error) {
      if (!(error instanceof RevisionDeSeanceObsoleteError)) {
        throw error;
      }
    }
  }
  throw new RevisionDeSeanceObsoleteError(acces.sessionId);
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
