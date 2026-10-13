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

export function assertSeanceTrouvee(
  session: SessionRecord | null,
  cle: string,
): SessionRecord {
  if (!session) {
    throw new SessionNotFoundError(cle);
  }
  return session;
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
  const trouvee = assertSeanceTrouvee(session, sessionId);
  if (!estAutorise(trouvee)) {
    throw new SessionNotOwnedError(sessionId);
  }
  return trouvee;
}
