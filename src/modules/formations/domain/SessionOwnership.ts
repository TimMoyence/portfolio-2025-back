import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from './errors/FormationErrors';
import type { SessionRecord } from './ISessions.repository';

export const ROLE_ADMINISTRATEUR = 'admin';

export interface ActeurFormation {
  readonly id: string;
  readonly roles: readonly string[];
}

export function assertSessionOwnedBy(
  session: SessionRecord | null,
  sessionId: string,
  teacherId: string,
): SessionRecord {
  return assertAccesAutorise(
    session,
    sessionId,
    (trouvee) => trouvee.teacherId === teacherId,
  );
}

export function assertSessionReadableBy(
  session: SessionRecord | null,
  sessionId: string,
  acteur: ActeurFormation,
): SessionRecord {
  return assertAccesAutorise(
    session,
    sessionId,
    (trouvee) =>
      trouvee.teacherId === acteur.id ||
      acteur.roles.includes(ROLE_ADMINISTRATEUR),
  );
}

function assertAccesAutorise(
  session: SessionRecord | null,
  sessionId: string,
  estAutorise: (session: SessionRecord) => boolean,
): SessionRecord {
  if (!session) {
    throw new SessionNotFoundError(sessionId);
  }
  if (!estAutorise(session)) {
    throw new SessionNotOwnedError(sessionId);
  }
  return session;
}
